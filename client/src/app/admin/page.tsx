'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The server enforces admin access; this just avoids a pointless request
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/reports');
        setReports(data.data || []);
      } catch (error) {
        console.error('Failed to load reports', error);
        toast.error(getErrorMessage(error, 'Failed to load reports'));
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.isAdmin) fetchReports();
    else setIsLoading(false);
  }, [user]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/reports/${id}/status`, { status });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      toast.success(`Report marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Remove this listing from the marketplace?')) return;
    try {
      await api.delete(`/listings/${listingId}/admin`);
      toast.success('Listing removed');
      // Refresh reports after deletion to reflect the deleted state
      const { data } = await api.get('/reports');
      setReports(data.data || []);
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  if (isAuthLoading) return null;

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Admin access required</h2>
          <p className="text-text-muted mb-6">This page is only for marketplace moderators.</p>
          <Link href="/" className="btn-primary">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-text-secondary">Manage reported listings and moderate content.</p>
          </div>
        </div>

        <div className="panel-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No reports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-hover text-text-secondary text-sm">
                    <th className="p-4 font-medium border-b border-border-subtle">Listing</th>
                    <th className="p-4 font-medium border-b border-border-subtle">Reported By</th>
                    <th className="p-4 font-medium border-b border-border-subtle">Reason</th>
                    <th className="p-4 font-medium border-b border-border-subtle">Status</th>
                    <th className="p-4 font-medium border-b border-border-subtle">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} className="border-b border-border-subtle last:border-0 hover:bg-bg-panel/50">
                      <td className="p-4">
                        {report.listingId ? (
                          <div>
                            <Link href={`/listing/${report.listingId._id}`} className="font-semibold text-brand-primary hover:underline block truncate max-w-xs">
                              {report.listingId.title}
                            </Link>
                            <div className="text-xs text-text-muted mt-1">
                              Status: {report.listingId.status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Listing Deleted</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-medium text-text-primary">{report.reporterId?.name || 'Unknown'}</div>
                        <div className="text-xs text-text-muted">{report.reporterId?.email}</div>
                      </td>
                      <td className="p-4 text-sm max-w-[200px]">
                        <div className="font-semibold text-red-500 mb-1">{report.reason}</div>
                        <div className="text-xs text-text-secondary truncate" title={report.description}>
                          {report.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          report.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {report.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(report._id, 'REVIEWED')}
                                className="px-2 py-1 bg-bg-panel border border-border-subtle hover:bg-bg-hover text-xs font-medium rounded-md transition-colors"
                              >
                                Mark Reviewed
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(report._id, 'DISMISSED')}
                                className="px-2 py-1 bg-bg-panel border border-border-subtle hover:bg-bg-hover text-xs font-medium rounded-md transition-colors"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {report.listingId && report.listingId.status !== 'DELETED' && (
                            <button
                              onClick={() => handleDeleteListing(report.listingId._id)}
                              className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 text-xs font-medium rounded-md transition-colors"
                            >
                              Delete Listing
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
