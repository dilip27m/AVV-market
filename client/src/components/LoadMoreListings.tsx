'use client';

import useSWRInfinite from 'swr/infinite';
import { ListingCard } from './ListingCard';
import { api } from '@/lib/api';
import { ListingSummary } from '@/lib/types';

interface ListingsPage {
  listings: ListingSummary[];
  pagination: { hasMore: boolean };
}

const fetcher = (url: string) => api.get<{ data: ListingsPage }>(url).then((res) => res.data.data);

interface LoadMoreProps {
  /** Last item already rendered by the server (used as the cursor). */
  lastListingId?: string;
  initialHasMore: boolean;
  /** The active filters as a query string (without page/cursor). */
  query: string;
}

export function LoadMoreListings({ lastListingId, initialHasMore, query }: LoadMoreProps) {
  const getKey = (pageIndex: number, previousPageData: ListingsPage | null) => {
    if (pageIndex === 0 && !initialHasMore) return null;
    if (previousPageData && (!previousPageData.listings.length || !previousPageData.pagination.hasMore)) return null;

    const params = new URLSearchParams(query);
    // Server rendered page 1; page numbers are used for price sorts, cursors for date sorts
    params.set('page', String(pageIndex + 2));
    const cursor = previousPageData
      ? previousPageData.listings[previousPageData.listings.length - 1]?._id
      : lastListingId;
    if (cursor) params.set('cursor', cursor);

    return `/listings?${params.toString()}`;
  };

  const { data, error, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    initialSize: 0, // fetch only when the user asks for more
  });

  const additional = data ? data.flatMap((page) => page.listings) : [];
  const lastPage = data?.[data.length - 1];
  const hasMore = lastPage ? lastPage.pagination.hasMore : initialHasMore;
  const isLoadingMore = isValidating && size > (data?.length || 0);

  if (additional.length === 0 && !hasMore) return null;

  return (
    <>
      {additional.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-3 sm:mt-6">
          {additional.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}

      {error && <p className="text-center text-sm text-danger mt-6">Couldn&apos;t load more items. Try again.</p>}

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button onClick={() => setSize(size + 1)} disabled={isLoadingMore} className="btn-secondary px-8">
            {isLoadingMore ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-text-muted border-t-text-primary animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </>
  );
}
