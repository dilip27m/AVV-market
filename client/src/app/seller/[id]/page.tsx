'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar, Avatar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { ListingGridSkeleton } from '@/components/ListingCardSkeleton';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { formatPrice, leavingLabel } from '@/lib/format';
import { ListingSummary } from '@/lib/types';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

interface SellerProfile {
  _id: string;
  name: string;
  profileImage?: string;
  meetAddress?: string;
  averageRating: number;
  totalRatings: number;
  totalItemsSold: number;
  activeListings: number;
  leavingDate?: string | null;
  isVerified?: boolean;
  createdAt: string;
}

export default function SellerStorefront() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'FOR_SALE' | 'SOLD'>('FOR_SALE');

  const { data: seller, error, isLoading } = useSWR<SellerProfile>(`/users/${id}`, fetcher);
  const { data: listings, isLoading: listingsLoading } = useSWR<ListingSummary[]>(`/users/${id}/listings`, fetcher);

  const isMe = user?._id === id;
  const leaving = leavingLabel(seller?.leavingDate);

  const forSaleListings = (listings || []).filter((l) => l.status === 'ACTIVE' || l.status === 'RESERVED');
  const soldListings = (listings || []).filter((l) => l.status === 'SOLD');
  const displayedListings = tab === 'FOR_SALE' ? forSaleListings : soldListings;

  const handleBlockSeller = async () => {
    if (!seller) return;
    const ok = await confirm({
      title: `Block ${seller.name}'s account?`,
      message: 'This user will be suspended from signing in, and ALL their active listings will be removed from the marketplace.',
      confirmLabel: 'Block Account',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.post(`/users/${id}/block`, { reason: 'Policy violation' });
      toast.success(`${seller.name} has been blocked and listings removed`);
      window.location.href = '/admin';
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to block user'));
    }
  };

  // A ready-to-paste message for hostel WhatsApp groups
  const handleShare = async () => {
    if (!seller) return;
    const url = window.location.href;
    const lines = (listings || []).slice(0, 8).map((l) => `• ${l.title} — ${formatPrice(l.price)}`);
    const text = [
      `🎓 ${isMe ? 'My' : `${seller.name}'s`} farewell sale on CampusMart${leaving ? ` (${leaving.toLowerCase()})` : ''}`,
      ...lines,
      (listings?.length || 0) > 8 ? `…and ${(listings?.length || 0) - 8} more` : '',
      url,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      navigator.share({ title: `${seller.name}'s items`, text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied! Paste it in your WhatsApp groups.');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-2xl font-bold mb-2">Seller not found</h1>
          <Link href="/" className="btn-primary mt-4">Browse listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-panel p-6 sm:p-10 mb-10 [box-shadow:var(--shadow-card)]">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl" aria-hidden="true" />
          {isLoading || !seller ? (
            <div className="h-24 skeleton rounded-2xl" />
          ) : (
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <Avatar name={seller.name} src={seller.profileImage} size={88} />
              <div className="flex-1 min-w-0 space-y-2">
                {leaving && (
                  <span className="badge bg-warning-soft text-warning normal-case tracking-normal">🎓 Farewell sale · {leaving}</span>
                )}
                <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-2 flex-wrap">
                  {seller.name}
                  {seller.isVerified && <span className="badge bg-brand-soft text-brand-primary">Verified student</span>}
                </h1>
                <p className="text-sm text-text-secondary">
                  ⭐ {seller.averageRating.toFixed(1)} ({seller.totalRatings} {seller.totalRatings === 1 ? 'rating' : 'ratings'}) ·{' '}
                  {seller.totalItemsSold} sold · {seller.activeListings} for sale
                </p>
                {seller.meetAddress && <p className="text-sm text-text-muted">📍 Usually meets at {seller.meetAddress}</p>}
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button onClick={handleShare} className="btn-primary text-sm">
                  {isMe ? 'Share my sale' : 'Share'}
                </button>
                {isMe && (
                  <Link href="/sell" className="btn-secondary text-sm">+ Add item</Link>
                )}
                {user?.isAdmin && !isMe && (
                  <button
                    onClick={handleBlockSeller}
                    className="inline-flex items-center justify-center rounded-full bg-danger-soft text-danger border border-danger/30 text-xs font-semibold px-3 py-2 hover:bg-danger hover:text-white transition-colors"
                  >
                    Block Account
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Listing tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 rounded-full bg-bg-panel border border-border-subtle">
            <button
              onClick={() => setTab('FOR_SALE')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === 'FOR_SALE' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              For Sale ({forSaleListings.length})
            </button>
            <button
              onClick={() => setTab('SOLD')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === 'SOLD' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sold Out ({soldListings.length})
            </button>
          </div>
          <span className="text-sm text-text-muted">
            {displayedListings.length} {displayedListings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {listingsLoading ? (
          <ListingGridSkeleton count={4} />
        ) : displayedListings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedListings.map((l) => (
              <ListingCard
                key={l._id}
                listing={l}
                seller={{
                  name: seller?.name || l.sellerName,
                  rating: seller?.averageRating || 0,
                  leavingDate: seller?.leavingDate,
                  isVerified: seller?.isVerified,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
            <p className="text-text-muted text-sm mb-4">
              {tab === 'FOR_SALE' ? 'Nothing for sale right now.' : 'No items sold yet.'}
            </p>
            {isMe && tab === 'FOR_SALE' && <Link href="/sell" className="btn-primary">Sell something</Link>}
          </div>
        )}
      </main>
    </div>
  );
}
