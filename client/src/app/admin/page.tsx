'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { timeAgo } from '@/lib/format';

type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

interface Report {
  _id: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  listingId: { _id: string; title: string; status: string; sellerName: string; sellerId?: string } | null;
  reporterId: { name: string; email: string } | null;
}

interface BlockedUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  blockedReason?: string;
  blockedAt?: string;
  createdAt: string;
}

const reportsFetcher = (url: string) => api.get(url).then((res) => res.data.data as Report[]);
const blockedFetcher = (url: string) => api.get(url).then((res) => res.data.data as BlockedUser[]);

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: 'bg-warning-soft text-warning',
  REVIEWED: 'bg-success-soft text-success',
  DISMISSED: 'bg-bg-hover text-text-muted',
};

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'BLOCKED'>('REPORTS');
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('PENDING');

  // The server enforces admin access; skip the request for everyone else
  const { data: reports = [], isLoading: isReportsLoading, mutate: mutateReports } = useSWR(
    user?.isAdmin ? '/reports' : null,
    reportsFetcher
  );

  const { data: blockedUsers = [], isLoading: isBlockedLoading, mutate: mutateBlocked } = useSWR(
    user?.isAdmin ? '/users/admin/blocked' : null,
    blockedFetcher
  );

  const visible = filter === 'ALL' ? reports : reports.filter((r) => r.status === filter);
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  const handleUpdateStatus = async (id: string, status: ReportStatus) => {
    try {
      await api.patch(`/reports/${id}/status`, { status });
      mutateReports(reports.map((r) => (r._id === id ? { ...r, status } : r)), false);
      toast.success(`Report ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update report'));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const ok = await confirm({
      title: 'Remove this listing?',
      message: 'It will be hidden from the marketplace and its open reports marked reviewed.',
      confirmLabel: 'Remove Listing',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/listings/${listingId}/admin`);
      toast.success('Listing removed');
      mutateReports();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove listing'));
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    const ok = await confirm({
      title: `Block ${userName}'s account?`,
      message: 'This user will be suspended from signing in, and ALL their active listings will be removed from the marketplace immediately.',
      confirmLabel: 'Block Account',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.post(`/users/${userId}/block`, { reason: 'Inappropriate content / community policy violation' });
      toast.success(`${userName} has been blocked and listings removed`);
      mutateReports();
      mutateBlocked();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to block user'));
    }
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    const ok = await confirm({
      title: `Unblock ${userName}?`,
      message: 'This user will be allowed to sign in and post listings again.',
      confirmLabel: 'Unblock Account',
      danger: false,
    });
    if (!ok) return;
    try {
      await api.post(`/users/${userId}/unblock`);
      toast.success(`${userName} has been unblocked`);
      mutateBlocked();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to unblock user'));
    }
  };

  if (isAuthLoading) return null;

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-text-muted mb-6">This page is only for marketplace moderators.</p>
          <Link href="/" className="btn-primary">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Admin Moderation</h1>
            <p className="text-text-secondary">
              {pendingCount} report{pendingCount === 1 ? '' : 's'} waiting · {blockedUsers.length} blocked account{blockedUsers.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Main View Tabs */}
          <div className="inline-flex p-1 rounded-full bg-bg-panel border border-border-subtle">
            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'REPORTS' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Reports ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('BLOCKED')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'BLOCKED' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Blocked Accounts ({blockedUsers.length})
            </button>
          </div>
        </div>

        {activeTab === 'REPORTS' ? (
          <>
            {/* Filter buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex p-1 rounded-full bg-bg-panel border border-border-subtle">
                {(['PENDING', 'REVIEWED', 'DISMISSED', 'ALL'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      filter === s ? 'bg-text-primary text-bg-base' : 'text-text-secondary'
                    }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {isReportsLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-3xl" />)}</div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel text-text-muted">
                No reports in this view. 🎉
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map((report) => (
                  <li key={report._id} className="panel-card !p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${STATUS_STYLES[report.status]}`}>{report.status}</span>
                        <span className="font-semibold text-danger text-sm">{report.reason}</span>
                        <span className="text-xs text-text-muted">· {timeAgo(report.createdAt)}</span>
                      </div>
                      {report.listingId ? (
                        <Link href={`/listing/${report.listingId._id}`} className="font-semibold hover:underline block truncate">
                          {report.listingId.title}
                          <span className="text-text-muted font-normal text-sm"> by {report.listingId.sellerName} · {report.listingId.status}</span>
                        </Link>
                      ) : (
                        <span className="italic text-text-muted">Listing no longer exists</span>
                      )}
                      {report.description && <p className="text-sm text-text-secondary">“{report.description}”</p>}
                      <p className="text-xs text-text-muted">
                        Reported by {report.reporterId?.name || 'Unknown'} {report.reporterId?.email && `(${report.reporterId.email})`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                      {report.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(report._id, 'REVIEWED')} className="btn-secondary text-xs px-3 py-2">Mark reviewed</button>
                          <button onClick={() => handleUpdateStatus(report._id, 'DISMISSED')} className="btn-secondary text-xs px-3 py-2">Dismiss</button>
                        </>
                      )}
                      {report.listingId && report.listingId.status !== 'DELETED' && (
                        <button
                          onClick={() => handleDeleteListing(report.listingId!._id)}
                          className="inline-flex items-center rounded-full bg-danger-soft text-danger px-3 py-2 text-xs font-semibold hover:opacity-80 transition-opacity"
                        >
                          Remove listing
                        </button>
                      )}
                      {report.listingId?.sellerId && report.listingId.sellerId !== user._id && (
                        <button
                          onClick={() => handleBlockUser(report.listingId!.sellerId!, report.listingId!.sellerName)}
                          className="inline-flex items-center rounded-full bg-danger text-white px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Block Account
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          /* Blocked Accounts Tab */
          <div>
            {isBlockedLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-3xl" />)}</div>
            ) : blockedUsers.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel text-text-muted">
                No accounts are currently blocked. ✨
              </div>
            ) : (
              <ul className="space-y-3">
                {blockedUsers.map((bUser) => (
                  <li key={bUser._id} className="panel-card !p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={bUser.name} src={bUser.profileImage} size={44} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-text-primary truncate">{bUser.name}</p>
                          <span className="badge bg-danger-soft text-danger text-[10px]">BLOCKED</span>
                        </div>
                        <p className="text-xs text-text-muted truncate">{bUser.email}</p>
                        {bUser.blockedReason && (
                          <p className="text-xs text-danger mt-0.5">Reason: {bUser.blockedReason}</p>
                        )}
                        {bUser.blockedAt && (
                          <p className="text-[11px] text-text-muted">Blocked {timeAgo(bUser.blockedAt)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblockUser(bUser._id, bUser.name)}
                      className="btn-secondary text-xs px-4 py-2 shrink-0 self-start sm:self-center"
                    >
                      Unblock Account
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
