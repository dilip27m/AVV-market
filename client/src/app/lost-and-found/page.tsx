'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { timeAgo, whatsAppLink } from '@/lib/format';

interface MissingItem {
  _id: string;
  title: string;
  description: string;
  lastSeenLocation: string;
  images: string[];
  status: 'MISSING' | 'FOUND' | 'CLOSED';
  createdAt: string;
  reporterName: string;
  reporterId?: { _id: string; name: string; phone?: string };
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.data.items as MissingItem[]);

export default function LostAndFound() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'MISSING' | 'FOUND'>('MISSING');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: items = [], error, isLoading, mutate } = useSWR(`/missing-items?status=${tab}`, fetcher);

  const q = searchQuery.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((item) => `${item.title} ${item.description} ${item.lastSeenLocation}`.toLowerCase().includes(q))
    : items;

  const handleMarkFound = async (item: MissingItem) => {
    const ok = await confirm({ title: 'Got it back? 🎉', message: 'This moves the report to “Found”.', confirmLabel: 'Mark as found' });
    if (!ok) return;
    try {
      await api.patch(`/missing-items/${item._id}/status`, { status: 'FOUND' });
      toast.success('So glad you found it!');
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update'));
    }
  };

  const handleDelete = async (item: MissingItem) => {
    const ok = await confirm({ title: 'Delete this report?', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/missing-items/${item._id}`);
      toast.success('Report deleted');
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete'));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Lost & Found</h1>
            <p className="text-text-secondary max-w-xl">
              Lost something on campus? Report it. Buying something expensive? Check it wasn&apos;t reported stolen.
            </p>
          </div>
          <Link href="/lost-and-found/report" className="btn-primary shrink-0">Report a lost item</Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="inline-flex p-1 rounded-full bg-bg-panel border border-border-subtle shrink-0" role="tablist">
            {(['MISSING', 'FOUND'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${tab === t ? 'bg-text-primary text-bg-base' : 'text-text-secondary'}`}
              >
                {t === 'MISSING' ? 'Still missing' : 'Reunited'}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 !bg-bg-panel"
            placeholder="Search by item, brand, or place..."
            aria-label="Search lost items"
          />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 skeleton rounded-3xl" />)}
          </div>
        ) : error ? (
          <p className="text-center text-danger py-12">Couldn&apos;t load reports. Please refresh.</p>
        ) : filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isMine = !!user && item.reporterId?._id === user._id;
              const phone = item.reporterId?.phone;
              return (
                <article key={item._id} className="panel-card !p-0 overflow-hidden flex flex-col">
                  {item.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.title} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`badge ${item.status === 'MISSING' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>
                        {item.status === 'MISSING' ? 'Missing' : 'Found'}
                      </span>
                      <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-snug">{item.title}</h2>
                      {item.description && <p className="text-sm text-text-secondary line-clamp-3 mt-1">{item.description}</p>}
                    </div>
                    {item.lastSeenLocation && (
                      <p className="text-sm"><span className="text-text-muted">Last seen:</span> {item.lastSeenLocation}</p>
                    )}
                    <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm min-w-0">
                        <Avatar name={item.reporterName} size={24} />
                        <span className="truncate">{item.reporterName}</span>
                      </span>
                      {isMine ? (
                        <span className="flex gap-3 shrink-0">
                          {item.status === 'MISSING' && (
                            <button onClick={() => handleMarkFound(item)} className="text-xs font-semibold text-success hover:underline">Found it</button>
                          )}
                          <button onClick={() => handleDelete(item)} className="text-xs text-text-muted hover:text-danger">Delete</button>
                        </span>
                      ) : item.status === 'MISSING' && phone ? (
                        <a
                          href={whatsAppLink(phone, `Hi ${item.reporterName}, I might have found the "${item.title}" you reported on CampusMart.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center rounded-full bg-[#25D366] hover:bg-[#1ebd5a] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          I found it
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
            <div className="text-5xl mb-4" aria-hidden="true">{tab === 'MISSING' ? '🧭' : '🤗'}</div>
            <h2 className="text-lg font-bold mb-1">{q ? 'No matches' : tab === 'MISSING' ? 'Nothing reported missing' : 'No reunions yet'}</h2>
            <p className="text-text-muted text-sm">{q ? 'Try a different search.' : 'Hopefully it stays that way!'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
