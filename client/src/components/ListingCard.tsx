'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ListingSummary } from '@/lib/types';
import { discountPercent, formatPrice, leavingLabel, timeAgo } from '@/lib/format';
import { useWishlist } from '@/lib/useWishlist';

interface ListingCardProps {
  listing: ListingSummary;
  /** Override seller details (e.g. on the seller's own storefront). */
  seller?: { name: string; rating: number; leavingDate?: string | null; isVerified?: boolean };
  priority?: boolean;
}

export function ListingCard({ listing, seller: sellerOverride, priority = false }: ListingCardProps) {
  const { isSaved, toggle } = useWishlist();
  const populated = typeof listing.sellerId === 'object' ? listing.sellerId : undefined;

  const seller = sellerOverride || {
    name: populated?.name || listing.sellerName || 'Student',
    rating: populated?.averageRating || 0,
    leavingDate: populated?.leavingDate,
    isVerified: populated?.isVerified,
  };

  const imageUrl = listing.images?.[0];
  const discount = discountPercent(listing.price, listing.originalPrice);
  const leaving = leavingLabel(seller.leavingDate);
  const isFree = listing.price <= 0;
  const isReserved = listing.status === 'RESERVED';
  const isSold = listing.status === 'SOLD';
  const saved = isSaved(listing._id);

  return (
    <div className="group relative flex flex-col h-full rounded-3xl border border-border-subtle bg-bg-panel overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/40 [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)]">
      <Link href={`/listing/${listing._id}`} className="flex flex-col flex-1 focus-visible:outline-none" aria-label={`${listing.title}, ${formatPrice(listing.price)}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] w-full bg-bg-hover overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSold ? 'grayscale opacity-60' : isReserved ? 'opacity-70' : ''}`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">No photo</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
            {isSold && <span className="badge bg-black/80 text-white">Sold</span>}
            {isReserved && <span className="badge bg-black/80 text-white">Reserved</span>}
            {isFree && !isReserved && !isSold && <span className="badge bg-success text-white">Free</span>}
            {discount && discount >= 10 && !isFree && !isSold && (
              <span className="badge bg-brand-primary" style={{ color: 'var(--text-on-brand)' }}>
                {discount}% off
              </span>
            )}
          </div>

          {leaving && (
            <span className="absolute bottom-2.5 left-2.5 badge bg-warning-soft text-warning backdrop-blur-md normal-case tracking-normal font-semibold border border-warning/20">
              ⏳ {leaving}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-lg sm:text-xl font-extrabold font-[family-name:var(--font-display)] ${isFree ? 'text-success' : 'text-text-primary'}`}>
              {formatPrice(listing.price)}
            </span>
            {discount && !isFree && listing.originalPrice && (
              <span className="text-xs text-text-muted line-through">₹{listing.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>

          <h3 className="text-sm font-medium text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors font-sans tracking-normal">
            {listing.title}
          </h3>

          <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1 min-w-0">
              <span className="truncate">{seller.name}</span>
              {seller.isVerified && (
                <svg className="h-3.5 w-3.5 text-brand-primary shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Verified student">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {seller.rating > 0 && <span className="shrink-0">· ⭐ {seller.rating.toFixed(1)}</span>}
            </span>
            {listing.createdAt && <span className="shrink-0">{timeAgo(listing.createdAt)}</span>}
          </div>
        </div>
      </Link>

      {/* Save button (outside the link so it doesn't navigate) */}
      <button
        type="button"
        onClick={() => toggle(listing._id)}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        aria-pressed={saved}
        className={`absolute top-2.5 right-2.5 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
          saved ? 'bg-white text-red-500' : 'bg-black/30 text-white hover:bg-black/50'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
}
