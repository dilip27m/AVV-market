'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/Navbar';
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
  listingId: { _id: string; title: string; status: string; sellerName: string } | null;
  reporterId: { name: string; email: string } | null;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.data as Report[]);

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: 'bg-warning-soft text-warning',
  REVIEWED: 'bg-success-soft text-success',
  DISMISSED: 'bg-bg-hover text-text-muted',
};

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('PENDING');

  // The server enforces admin access; skip the request for everyone else
  const { data: reports = [], isLoading, mutate } = useSWR(user?.isAdmin ? '/reports' : null, fetcher);
  const visible = filter === 'ALL' ? reports : reports.filter((r) => r.status === filter);
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  const handleUpdateStatus = async (id: string, status: ReportStatus) => {
    try {
      await api.patch(`/reports/${id}/status`, { status });
      mutate(reports.map((r) => (r._id === id ? { ...r, status } : r)), false);
      toast.success(`Report ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update report'));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const ok = await confirm({
      title: 'Remove this listing?',
      message: 'It will be hidden from the marketplace and its open reports marked reviewed.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/listings/${listingId}/admin`);
      toast.success('Listing removed');
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove listing'));
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
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Moderation</h1>
            <p className="text-text-secondary">{pendingCount} report{pendingCount === 1 ? '' : 's'} waiting for review</p>
          </div>
          <div className="inline-flex p-1 rounded-full bg-bg-panel border border-border-subtle">
            {(['PENDING', 'REVIEWED', 'DISMISSED', 'ALL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${filter === s ? 'bg-text-primary text-bg-base' : 'text-text-secondary'}`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-3xl" />)}</div>
        ) : visible.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel text-text-muted">
            Nothing here. 🎉
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
                      className="inline-flex items-center rounded-full bg-danger-soft text-danger px-3 py-2 text-xs font-semibold hover:opacity-80"
                    >
                      Remove listing
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
