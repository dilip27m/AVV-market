'use client';

import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { ListingCard } from './ListingCard';
import { LoadMoreListings } from './LoadMoreListings';
import { api } from '@/lib/api';
import { ListingSummary } from '@/lib/types';

interface ListingsResponse {
  listings: ListingSummary[];
  pagination: {
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.data as ListingsResponse);

interface HomeFeedProps {
  initialListings: ListingSummary[];
  initialTotal: number;
  initialHasMore: boolean;
  initialQuery: string;
  heading: string;
  isFiltered: boolean;
}

export function HomeFeed({
  initialListings,
  initialTotal,
  initialHasMore,
  initialQuery,
  heading,
  isFiltered,
}: HomeFeedProps) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const isInitialParams = currentQuery === initialQuery;

  // Real-time SWR auto-refreshing feed: updates on URL change, on focus, and every 12 seconds in the background
  const { data, isValidating, mutate } = useSWR<ListingsResponse>(
    `/listings?${currentQuery}`,
    fetcher,
    {
      fallbackData: isInitialParams
        ? {
            listings: initialListings,
            pagination: {
              total: initialTotal,
              totalPages: Math.ceil(initialTotal / 20),
              hasMore: initialHasMore,
            },
          }
        : undefined,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 12000, // Live auto-refresh every 12 seconds
      dedupingInterval: 2500,
    }
  );

  const listings = data?.listings ?? (isInitialParams ? initialListings : []);
  const total = data?.pagination?.total ?? (isInitialParams ? initialTotal : 0);
  const hasMore = data?.pagination?.hasMore ?? (isInitialParams ? initialHasMore : false);

  const dynamicHeading = searchParams.get('free')
    ? 'Free stuff 🎁'
    : searchParams.get('search')
      ? `Results for “${searchParams.get('search')}”`
      : searchParams.get('includeSold')
        ? 'All items (including sold out)'
        : searchParams.get('category') || heading;

  return (
    <div>
      {/* Feed Header with Live Auto-Refresh Indicator */}
      <div className="mt-8 mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold">{dynamicHeading}</h2>
          <button
            type="button"
            onClick={() => mutate()}
            aria-label="Refresh listings"
            title="Refresh listings"
            className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isValidating ? 'animate-spin text-brand-primary' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live · {total} {total === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {listings.map((listing, i) => (
              <ListingCard key={listing._id} listing={listing} priority={i < 4} />
            ))}
          </div>
          <LoadMoreListings
            key={currentQuery}
            query={currentQuery}
            lastListingId={listings[listings.length - 1]?._id}
            initialHasMore={hasMore}
          />
        </>
      ) : (
        <div className="py-20 px-6 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
          <div className="text-5xl mb-4" aria-hidden="true">{isFiltered ? '🔍' : '🌱'}</div>
          <h3 className="text-lg font-bold mb-1">{isFiltered ? 'Nothing matches yet' : 'Be the first to sell'}</h3>
          <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
            {isFiltered
              ? 'Try a different search, or tell sellers what you need on the Wanted board.'
              : 'The marketplace is empty right now. List something and get the ball rolling!'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isFiltered ? (
              <>
                <Link href="/" className="btn-secondary">Clear filters</Link>
                <Link href="/wanted" className="btn-primary">Post a request</Link>
              </>
            ) : (
              <Link href="/sell" className="btn-primary">Sell an item</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
