'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { api, getErrorMessage, redirectToLogin } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { CATEGORY_ICONS, LISTING_CATEGORIES, ListingCategory } from '@/lib/constants';
import { timeAgo, whatsAppLink } from '@/lib/format';

interface WantedPost {
  _id: string;
  title: string;
  description: string;
  category: ListingCategory;
  budget?: number;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  createdAt: string;
  userName: string;
  userId: { _id: string; name: string; profileImage?: string; phone?: string; isVerified?: boolean } | string;
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export default function WantedBoard() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [category, setCategory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ posts: WantedPost[] }>(
    // Include the user id so the list refetches (with phone numbers) after login
    `/wanted${category ? `?category=${encodeURIComponent(category)}` : ''}#${user?._id || 'guest'}`,
    (key: string) => fetcher(key.split('#')[0]),
    { refreshInterval: 15000, revalidateOnFocus: true }
  );
  const posts = data?.posts || [];

  const openForm = () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    setIsFormOpen(true);
  };

  const handleClose = async (post: WantedPost, status: 'FULFILLED' | 'CLOSED') => {
    const ok = await confirm({
      title: status === 'FULFILLED' ? 'Found what you needed?' : 'Close this request?',
      message: 'It will be removed from the board.',
      confirmLabel: status === 'FULFILLED' ? 'Yes, got it!' : 'Close request',
    });
    if (!ok) return;
    try {
      await api.patch(`/wanted/${post._id}/status`, { status });
      toast.success(status === 'FULFILLED' ? 'Great! Request closed.' : 'Request closed');
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update request'));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Wanted board</h1>
            <p className="text-text-secondary max-w-xl">
              Can&apos;t find it? Post what you&apos;re looking for. Seniors clearing out their rooms will reach out on WhatsApp.
            </p>
          </div>
          <button onClick={openForm} className="btn-primary shrink-0">+ Post a request</button>
        </div>

        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
          <div className="flex gap-2 w-max">
            {['', ...LISTING_CATEGORIES].map((cat) => (
              <button
                key={cat || 'all'}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  category === cat ? 'bg-text-primary text-bg-base border-text-primary' : 'bg-bg-panel border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat ? `${CATEGORY_ICONS[cat as ListingCategory]} ${cat}` : 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 skeleton rounded-3xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
            <div className="text-5xl mb-4" aria-hidden="true">🙋</div>
            <h2 className="text-lg font-bold mb-1">No requests yet</h2>
            <p className="text-sm text-text-muted mb-6">Looking for something specific? Be the first to ask.</p>
            <button onClick={openForm} className="btn-primary">Post a request</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map((post) => {
              const poster = typeof post.userId === 'object' ? post.userId : null;
              const isMine = !!user && poster?._id === user._id;
              const message = `Hi ${post.userName}! I saw your CampusMart request for "${post.title}". I have one — interested?`;
              return (
                <article key={post._id} className="panel-card !p-5 flex flex-col gap-3 animate-fade-up">
                  <div className="flex items-start justify-between gap-3">
                    <span className="chip">{CATEGORY_ICONS[post.category] || '✨'} {post.category}</span>
                    {post.budget !== undefined && post.budget !== null && (
                      <span className="text-sm font-bold text-success shrink-0">
                        Budget ₹{post.budget.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-snug">{post.title}</h2>
                    {post.description && <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap line-clamp-3">{post.description}</p>}
                  </div>
                  <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0 text-sm">
                      <Avatar name={post.userName} src={poster?.profileImage} size={28} />
                      <span className="truncate">{post.userName}</span>
                      <span className="text-text-muted text-xs shrink-0">· {timeAgo(post.createdAt)}</span>
                    </span>
                    {isMine ? (
                      <span className="flex gap-2 shrink-0">
                        <button onClick={() => handleClose(post, 'FULFILLED')} className="text-xs font-semibold text-success hover:underline">Got it</button>
                        <button onClick={() => handleClose(post, 'CLOSED')} className="text-xs text-text-muted hover:underline">Close</button>
                      </span>
                    ) : poster?.phone ? (
                      <a
                        href={whatsAppLink(poster.phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center rounded-full bg-[#25D366] hover:bg-[#1ebd5a] px-4 py-2 text-xs font-semibold text-white"
                      >
                        I have this
                      </a>
                    ) : !user ? (
                      <Link href="/login?redirect=/wanted" className="shrink-0 text-xs font-semibold text-brand-primary hover:underline">
                        Log in to reply
                      </Link>
                    ) : (
                      <span className="text-xs text-text-muted shrink-0">No contact shared</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <WantedForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onPosted={() => {
          setIsFormOpen(false);
          mutate();
        }}
        hasPhone={!!user?.phone}
      />
    </div>
  );
}

function WantedForm({ open, onClose, onPosted, hasPhone }: { open: boolean; onClose: () => void; onPosted: () => void; hasPhone: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Others');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/wanted', { title: title.trim(), description: description.trim(), category, budget });
      toast.success('Request posted! Sellers can now reach you.');
      setTitle('');
      setDescription('');
      setBudget('');
      onPosted();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="mb-0 mt-auto sm:m-auto w-full max-w-none sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h2 className="text-lg font-bold">What are you looking for?</h2>

        {!hasPhone && (
          <p className="text-sm rounded-xl bg-warning-soft text-warning p-3">
            Sellers contact you on WhatsApp.{' '}
            <Link href="/profile/edit" className="font-semibold underline">Add your number</Link> first.
          </p>
        )}

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Engineering drafter, used cycle"
          className="w-full"
          minLength={3}
          maxLength={120}
          required
          aria-label="What you need"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any details — size, brand, condition... (optional)"
          className="w-full min-h-[80px]"
          maxLength={500}
          aria-label="Details"
        />
        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="w-full">
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget ₹ (optional)"
            className="w-full"
            aria-label="Budget in rupees"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={isSubmitting || title.trim().length < 3} className="btn-primary flex-1">
            {isSubmitting ? 'Posting...' : 'Post request'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
