'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { ImageGallery } from '@/components/ImageGallery';
import { ReportDialog } from '@/components/ReportDialog';
import { OfferDialog } from '@/components/OfferDialog';
import { ListingCard } from '@/components/ListingCard';
import { SpinWheelModal, SpinResult } from '@/components/SpinWheelModal';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useWishlist } from '@/lib/useWishlist';
import { discountPercent, formatPrice, leavingLabel, timeAgo, whatsAppLink } from '@/lib/format';
import { ListingStatus, ListingSummary, SpinDiscountConfig } from '@/lib/types';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

interface ListingSeller {
  _id: string;
  name: string;
  profileImage?: string;
  averageRating?: number;
  totalRatings?: number;
  totalItemsSold?: number;
  phone?: string;
  leavingDate?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

interface ListingDetail {
  _id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  price: number;
  originalPrice?: number | null;
  isNegotiable: boolean;
  condition: string;
  sellerName: string;
  sellerPhone: string;
  meetAddress: string;
  spinDiscount?: SpinDiscountConfig;
  status: ListingStatus;
  expiresAt: string;
  createdAt: string;
  isExpired?: boolean;
  sellerId: ListingSeller;
}

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  text: string;
  createdAt: string;
}

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
  </svg>
);

export default function ListingDetails() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const confirm = useConfirm();
  const { isSaved, toggle: toggleSave } = useWishlist();

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      try {
        const saved = localStorage.getItem(`spin_${id}`);
        if (saved) {
          setSpinResult(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }
  }, [id]);

  const { data: listing, error, isLoading, mutate: mutateListing } = useSWR<ListingDetail>(
    `/listings/${id}`,
    fetcher,
    { refreshInterval: 12000, revalidateOnFocus: true }
  );
  const { data: comments = [], mutate: mutateComments } = useSWR<Comment[]>(
    `/comments/${id}`,
    fetcher,
    { refreshInterval: 8000, revalidateOnFocus: true }
  );

  const sellerId = listing?.sellerId?._id;
  const isOwner = !!user && !!sellerId && user._id === sellerId;

  const { data: myRating, mutate: mutateMyRating } = useSWR<number | null>(
    user && sellerId && !isOwner ? `/ratings/${sellerId}/mine` : null,
    fetcher
  );
  const { data: similar } = useSWR<{ listings: ListingSummary[] }>(
    listing ? `/listings?category=${encodeURIComponent(listing.category)}&limit=5` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 grid md:grid-cols-[1fr_380px] gap-8">
          <div className="aspect-[4/3] skeleton rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 w-1/2 skeleton" />
            <div className="h-6 w-3/4 skeleton" />
            <div className="h-48 skeleton rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="text-5xl mb-4" aria-hidden="true">🫥</div>
          <h1 className="text-2xl font-bold mb-2">This listing is gone</h1>
          <p className="text-text-secondary mb-6">It may have been sold or removed by the seller.</p>
          <Link href="/" className="btn-primary">Browse other items</Link>
        </div>
      </div>
    );
  }

  const seller = listing.sellerId;
  const sellerName = seller?.name || listing.sellerName;
  const contactPhone = listing.sellerPhone || seller?.phone || '';
  const isSold = listing.status === 'SOLD';
  const isReserved = listing.status === 'RESERVED';
  const isUnavailable = isSold || listing.status === 'DELETED' || !!listing.isExpired;
  const discount = discountPercent(listing.price, listing.originalPrice);
  const leaving = leavingLabel(seller?.leavingDate);
  const saved = isSaved(listing._id);
  const overlay = isSold ? 'SOLD' : listing.status === 'DELETED' ? 'REMOVED' : listing.isExpired ? 'EXPIRED' : isReserved ? 'RESERVED' : null;
  const similarItems = (similar?.listings || []).filter((l) => l._id !== listing._id).slice(0, 4);

  const chatLink = whatsAppLink(
    contactPhone,
    spinResult
      ? `Hi ${sellerName}! I spun the lucky wheel for "${listing.title}" and won ${spinResult.wonPercent}% OFF! Deal price: ₹${spinResult.discountedPrice} (Verification Code: ${spinResult.code}). Is it available?`
      : `Hi ${sellerName}! Is your "${listing.title}" (${formatPrice(listing.price)}) on CampusMart still available?`
  );

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setIsSubmittingComment(true);
      const { data } = await api.post(`/comments/${id}`, { text: newComment.trim() });
      mutateComments([...comments, data.data], false);
      setNewComment('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post. Please try again.'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!(await confirm({ title: 'Delete this comment?', confirmLabel: 'Delete', danger: true }))) return;
    mutateComments(comments.filter((c) => c._id !== commentId), false);
    try {
      await api.delete(`/comments/${commentId}`);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete comment.'));
    } finally {
      mutateComments();
    }
  };

  const handleRateSeller = async (rating: number) => {
    try {
      const res = await api.post('/ratings', { sellerId, rating });
      toast.success(myRating ? 'Rating updated' : 'Thanks for rating!');
      mutateMyRating(rating, false);
      mutateListing(
        { ...listing, sellerId: { ...seller, averageRating: res.data.data.averageRating, totalRatings: res.data.data.totalRatings } },
        false
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to rate seller.'));
    }
  };

  const handleSetStatus = async (status: 'ACTIVE' | 'RESERVED' | 'SOLD') => {
    if (status === listing.status) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/listings/${listing._id}/status`, { status });
      mutateListing({ ...listing, status }, false);
      toast.success(
        status === 'SOLD' ? 'Marked as sold. Congrats! 🎉' : status === 'RESERVED' ? 'Marked as reserved' : 'Listing is available again'
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update listing.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAdminDelete = async () => {
    const ok = await confirm({
      title: 'Remove this listing as Admin?',
      message: 'This listing will be immediately removed from the marketplace.',
      confirmLabel: 'Remove Listing',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/listings/${id}/admin`);
      toast.success('Listing removed by admin');
      mutateListing({ ...listing, status: 'DELETED' }, false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove listing'));
    }
  };

  const handleAdminBlockSeller = async () => {
    if (!sellerId) return;
    const ok = await confirm({
      title: `Block ${sellerName}'s account?`,
      message: 'This seller will be immediately suspended and all their active listings removed from the marketplace.',
      confirmLabel: 'Block Account',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.post(`/users/${sellerId}/block`, { reason: `Inappropriate listing: "${listing.title}"` });
      toast.success(`${sellerName} has been blocked and listings removed`);
      mutateListing({ ...listing, status: 'DELETED' }, false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to block seller'));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${listing.title} for ${formatPrice(listing.price)} on CampusMart`;
    if (navigator.share) {
      navigator.share({ title: listing.title, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const requireLogin = (action: string) => {
    toast(`Log in to ${action}`, { icon: '🔒' });
  };

  // ---------- Contact / owner actions (shared by sidebar and mobile bar) ----------
  const contactButtons = (compact: boolean) => {
    if (isOwner || isUnavailable) return null;
    if (!contactPhone) {
      return (
        <p className="w-full text-center text-sm bg-bg-hover text-text-muted py-3 px-4 rounded-2xl">
          No WhatsApp number yet — ask below.
        </p>
      );
    }
    return (
      <div className={`flex gap-2 ${compact ? '' : 'flex-col'}`}>
        <a
          href={chatLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-3 px-4 rounded-full transition-colors shadow-sm"
        >
          <WhatsAppIcon /> {compact ? 'Chat' : 'Chat on WhatsApp'}
        </a>
        {listing.isNegotiable && listing.price > 0 && (
          <button type="button" onClick={() => setIsOfferOpen(true)} className="btn-secondary flex-1">
            Make offer
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-28 md:pb-12">
        {user?.isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
            <div className="flex items-center gap-2 text-danger">
              <span className="font-bold text-sm">🛡️ Moderator Controls</span>
              <span className="text-xs text-text-secondary">· Seller: {sellerName}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {listing.status !== 'DELETED' && (
                <button
                  type="button"
                  onClick={handleAdminDelete}
                  className="px-3.5 py-1.5 rounded-full bg-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Delete Inappropriate Listing
                </button>
              )}
              {sellerId && sellerId !== user._id && (
                <button
                  type="button"
                  onClick={handleAdminBlockSeller}
                  className="px-3.5 py-1.5 rounded-full bg-danger-soft text-danger border border-danger/30 text-xs font-semibold hover:bg-danger hover:text-white transition-colors"
                >
                  Block Seller Account
                </button>
              )}
            </div>
          </div>
        )}
        <nav aria-label="Breadcrumb" className="text-sm text-text-muted flex items-center gap-2 mb-4 min-w-0">
          <Link href="/" className="hover:text-text-primary shrink-0">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/?category=${encodeURIComponent(listing.category)}`} className="hover:text-text-primary shrink-0">{listing.category}</Link>
          <span aria-hidden="true">›</span>
          <span className="text-text-primary truncate">{listing.title}</span>
        </nav>

        <div className="grid md:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
          {/* ---------- Left column ---------- */}
          <div className="space-y-6 min-w-0">
            <ImageGallery images={listing.images} alt={listing.title} overlay={overlay} />

            {/* Title block (mobile shows it here, desktop in the sidebar) */}
            <div className="md:hidden space-y-2">
              <PriceBlock listing={listing} discount={discount} spinResult={spinResult} />
              <h1 className="text-2xl font-extrabold leading-tight">{listing.title}</h1>
              <MetaChips listing={listing} leaving={leaving} />
            </div>

            <section className="panel-card space-y-4">
              <h2 className="text-lg font-bold">About this item</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-bg-base p-3">
                  <dt className="text-text-muted text-xs">Condition</dt>
                  <dd className="font-semibold">{listing.condition}</dd>
                </div>
                <div className="rounded-2xl bg-bg-base p-3">
                  <dt className="text-text-muted text-xs">Category</dt>
                  <dd className="font-semibold">{listing.category}</dd>
                </div>
                <div className="rounded-2xl bg-bg-base p-3 col-span-2 sm:col-span-1">
                  <dt className="text-text-muted text-xs">Meet at</dt>
                  <dd className="font-semibold truncate">{listing.meetAddress || 'Ask the seller'}</dd>
                </div>
              </dl>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description provided — ask the seller below.'}
              </p>
            </section>

            {/* Questions */}
            <section className="panel-card space-y-5">
              <h2 className="text-lg font-bold">Questions ({comments.length})</h2>

              {comments.length === 0 ? (
                <p className="text-sm text-text-muted">No questions yet. Ask about size, age, or whether the price is flexible.</p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment._id} className="flex gap-3">
                      <Avatar name={comment.userName} src={comment.userProfileImage} size={32} />
                      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-bg-base px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {comment.userName}
                            {comment.userId === sellerId && <span className="ml-2 badge bg-brand-soft text-brand-primary">Seller</span>}
                          </span>
                          <span className="flex items-center gap-2 shrink-0 text-xs text-text-muted">
                            {timeAgo(comment.createdAt)}
                            {user && (user._id === comment.userId || isOwner) && (
                              <button onClick={() => handleDeleteComment(comment._id)} className="text-danger hover:underline">
                                Delete
                              </button>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{comment.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t border-border-subtle">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isOwner ? 'Reply to buyers...' : 'Ask a question...'}
                    className="flex-1 min-w-0 text-sm"
                    maxLength={1000}
                    disabled={isSubmittingComment}
                    aria-label="Your question"
                  />
                  <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="btn-primary text-sm px-5">
                    {isSubmittingComment ? '...' : 'Post'}
                  </button>
                </form>
              ) : (
                <Link href={`/login?redirect=/listing/${id}`} className="btn-secondary w-full text-sm">
                  Log in to ask a question
                </Link>
              )}
            </section>
          </div>

          {/* ---------- Right column ---------- */}
          <aside className="space-y-5 md:sticky md:top-24">
            <div className="panel-card space-y-5">
              <div className="hidden md:block space-y-2">
                <PriceBlock listing={listing} discount={discount} spinResult={spinResult} />
                <h1 className="text-2xl font-extrabold leading-tight">{listing.title}</h1>
                <MetaChips listing={listing} leaving={leaving} />
              </div>

              {/* Spin the Wheel Discount Box */}
              {listing.spinDiscount?.enabled && !isUnavailable && listing.price > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-indigo-500/5 border border-amber-500/25 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl animate-bounce">🎡</span>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        {spinResult ? `You Won ${spinResult.wonPercent}% OFF!` : 'Lucky Wheel Discount'}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {isOwner
                          ? `Active for buyers: ${listing.spinDiscount.minPercent}%–${listing.spinDiscount.maxPercent}% off`
                          : spinResult
                          ? `Deal price: ${formatPrice(spinResult.discountedPrice)} (Code: ${spinResult.code})`
                          : `Win ${listing.spinDiscount.minPercent}% to ${listing.spinDiscount.maxPercent}% OFF!`}
                      </p>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsSpinModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <span>🎡</span>
                      <span>{spinResult ? 'View Won Deal / Spin Code' : 'Spin the Wheel to Win!'}</span>
                    </button>
                  )}
                </div>
              )}

              {isUnavailable && !isOwner && (
                <p className="text-center font-semibold rounded-2xl bg-bg-hover py-3">
                  {isSold ? 'This item has been sold' : 'This listing is no longer available'}
                </p>
              )}
              {isReserved && !isOwner && (
                <p className="text-sm rounded-2xl bg-warning-soft text-warning px-4 py-3">
                  Someone has reserved this. You can still message the seller in case it falls through.
                </p>
              )}

              {isOwner ? (
                <div className="space-y-3">
                  {listing.status !== 'DELETED' && (
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-bg-base border border-border-subtle" role="radiogroup" aria-label="Listing status">
                      {(['ACTIVE', 'RESERVED', 'SOLD'] as const).map((s) => (
                        <button
                          key={s}
                          role="radio"
                          aria-checked={listing.status === s}
                          disabled={isUpdatingStatus}
                          onClick={() => handleSetStatus(s)}
                          className={`py-2 rounded-full text-xs font-semibold transition-colors ${
                            listing.status === s ? 'bg-bg-panel shadow text-text-primary' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {s === 'ACTIVE' ? 'Available' : s === 'RESERVED' ? 'Reserved' : 'Sold'}
                        </button>
                      ))}
                    </div>
                  )}
                  <Link href={`/listing/${listing._id}/edit`} className="btn-primary w-full">Edit listing</Link>
                  <button onClick={handleShare} className="btn-secondary w-full">Share with your groups</button>
                </div>
              ) : (
                <div className="hidden md:block space-y-3">
                  {contactButtons(false)}
                </div>
              )}

              {!isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => (user ? toggleSave(listing._id) : requireLogin('save items'))}
                    aria-pressed={saved}
                    className={`btn-secondary flex-1 text-sm ${saved ? '!text-red-500 !border-red-300' : ''}`}
                  >
                    {saved ? '♥ Saved' : '♡ Save'}
                  </button>
                  <button onClick={handleShare} className="btn-secondary flex-1 text-sm">Share</button>
                </div>
              )}
            </div>

            {/* Seller card */}
            <div className="panel-card space-y-4">
              <Link href={`/seller/${sellerId}`} className="flex items-center gap-3 group">
                <Avatar name={sellerName} src={seller?.profileImage} size={48} />
                <div className="min-w-0">
                  <p className="font-semibold group-hover:underline flex items-center gap-1">
                    <span className="truncate">{sellerName}</span>
                    {seller?.isVerified && <span className="badge bg-brand-soft text-brand-primary shrink-0">Verified</span>}
                  </p>
                  <p className="text-sm text-text-muted">
                    ⭐ {(seller?.averageRating || 0).toFixed(1)} ({seller?.totalRatings || 0})
                    {seller?.totalItemsSold ? ` · ${seller.totalItemsSold} sold` : ''}
                  </p>
                </div>
                <span className="ml-auto text-text-muted" aria-hidden="true">›</span>
              </Link>

              {user && !isOwner && (
                <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
                  <span className="text-xs text-text-muted">{myRating ? 'Your rating' : 'Bought from them? Rate'}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateSeller(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        className={`text-xl px-0.5 transition-colors hover:text-yellow-400 ${myRating && star <= myRating ? 'text-yellow-400' : 'text-border-subtle'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border-subtle p-5 text-sm text-text-secondary space-y-2">
              <p className="font-semibold text-text-primary">🛡️ Stay safe</p>
              <p>Meet in a public spot on campus, check the item before paying, and never pay in advance.</p>
              <div className="flex justify-between items-center pt-1">
                <Link href="/safety" className="underline hover:text-text-primary">More tips</Link>
                {!isOwner && (
                  <button
                    onClick={() => (user ? setIsReportOpen(true) : requireLogin('report listings'))}
                    className="text-text-muted hover:text-danger"
                  >
                    Report listing
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>

        {similarItems.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-extrabold mb-5">More in {listing.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {similarItems.map((item) => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky contact bar on phones (sits above the bottom nav) */}
      {!isOwner && !isUnavailable && (
        <div
          className="md:hidden fixed inset-x-0 z-30 border-t border-border-subtle bg-bg-panel/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          <div className="shrink-0">
            <p className={`text-lg font-extrabold leading-none ${spinResult ? 'text-success' : listing.price <= 0 ? 'text-success' : ''}`}>
              {formatPrice(spinResult ? spinResult.discountedPrice : listing.price)}
            </p>
            {spinResult ? (
              <p className="text-[10px] text-amber-600 font-bold">🎡 {spinResult.wonPercent}% OFF</p>
            ) : listing.spinDiscount?.enabled ? (
              <button
                type="button"
                onClick={() => setIsSpinModalOpen(true)}
                className="text-[10px] text-amber-600 font-bold underline flex items-center gap-0.5"
              >
                <span>🎡</span> Spin wheel
              </button>
            ) : listing.isNegotiable ? (
              <p className="text-[11px] text-text-muted">Negotiable</p>
            ) : null}
          </div>
          <div className="flex-1">{contactButtons(true)}</div>
        </div>
      )}

      {listing.spinDiscount?.enabled && (
        <SpinWheelModal
          open={isSpinModalOpen}
          onClose={() => setIsSpinModalOpen(false)}
          listingId={listing._id}
          listingTitle={listing.title}
          listingPrice={listing.price}
          sellerPhone={contactPhone}
          sellerName={sellerName}
          minPercent={listing.spinDiscount.minPercent}
          maxPercent={listing.spinDiscount.maxPercent}
          existingResult={spinResult}
          onWon={(res) => setSpinResult(res)}
        />
      )}

      <ReportDialog listingId={listing._id} open={isReportOpen} onClose={() => setIsReportOpen(false)} />
      {contactPhone && (
        <OfferDialog
          open={isOfferOpen}
          onClose={() => setIsOfferOpen(false)}
          phone={contactPhone}
          sellerName={sellerName}
          title={listing.title}
          price={listing.price}
        />
      )}
    </div>
  );
}

function PriceBlock({
  listing,
  discount,
  spinResult,
}: {
  listing: ListingDetail;
  discount: number | null;
  spinResult?: SpinResult | null;
}) {
  const isFree = listing.price <= 0;

  if (spinResult && !isFree) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-extrabold font-[family-name:var(--font-display)] text-success">
            {formatPrice(spinResult.discountedPrice)}
          </span>
          <span className="text-text-muted line-through text-lg">
            {formatPrice(listing.price)}
          </span>
          <span className="badge bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">
            🎡 {spinResult.wonPercent}% OFF UNLOCKED
          </span>
        </div>
        <div className="text-xs text-text-muted flex items-center gap-1.5">
          <span>Verified Spin Code:</span>
          <span className="font-mono font-semibold text-text-primary px-1.5 py-0.5 rounded bg-bg-hover">
            {spinResult.code}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className={`text-3xl font-extrabold font-[family-name:var(--font-display)] ${isFree ? 'text-success' : 'text-text-primary'}`}>
        {formatPrice(listing.price)}
      </span>
      {discount && listing.originalPrice && !isFree && (
        <>
          <span className="text-text-muted line-through">₹{listing.originalPrice.toLocaleString('en-IN')}</span>
          <span className="badge bg-success-soft text-success">{discount}% off</span>
        </>
      )}
      {listing.spinDiscount?.enabled && !isFree && (
        <span className="badge bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
          🎡 Spin {listing.spinDiscount.minPercent}–{listing.spinDiscount.maxPercent}% OFF
        </span>
      )}
      {listing.isNegotiable && !isFree && <span className="chip">Negotiable</span>}
    </div>
  );
}

function MetaChips({ listing, leaving }: { listing: ListingDetail; leaving: string | null }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-text-muted">
      <span>Posted {timeAgo(listing.createdAt)}</span>
      {leaving && <span className="badge bg-warning-soft text-warning normal-case tracking-normal">⏳ Seller {leaving.toLowerCase()}</span>}
    </div>
  );
}
