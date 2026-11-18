'use client';

import useSWRInfinite from 'swr/infinite';
import { ListingCard } from './ListingCard';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

interface LoadMoreProps {
  initialListings: any[];
  initialHasMore: boolean;
  searchParams: {
    category: string;
    search: string;
    sort: string;
  };
}

export function LoadMoreListings({ initialListings, initialHasMore, searchParams }: LoadMoreProps) {
  // SWR Infinite key function
  const getKey = (pageIndex: number, previousPageData: any) => {
    // If we've reached the end, return null
    if (pageIndex === 0 && !initialHasMore) return null;
    if (previousPageData && (!previousPageData.listings?.length || !previousPageData.pagination?.hasMore)) return null;
    
    // pageIndex is 0 for the first client fetch, but we already have initialListings from SSR!
    // So the API page is pageIndex + 2 (since SSR loaded page 1)
    const page = pageIndex + 2; 

    const params = new URLSearchParams();
    if (searchParams.category && searchParams.category !== 'All') params.set('category', searchParams.category);
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    
    // Add page parameter
    params.set('page', page.toString());
    
    // Add cursor parameter if applicable
    if (previousPageData && previousPageData.listings?.length > 0) {
       const lastItem = previousPageData.listings[previousPageData.listings.length - 1];
       params.set('cursor', lastItem._id);
    } else if (pageIndex === 0 && initialListings.length > 0) {
       // First client fetch, cursor is the last item of the SSR initialListings
       const lastItem = initialListings[initialListings.length - 1];
       params.set('cursor', lastItem._id);
    }

    return `/listings?${params.toString()}`;
  };

  const { data, isLoading, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    initialSize: 0, // Don't fetch anything until the user asks for more
  });

  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  
  // Combine dynamically fetched items
  const additionalListings = data ? data.flatMap(pageData => 
    (pageData.listings || []).map((item: any) => ({
      ...item,
      seller: {
        name: item.sellerId?.name || item.sellerName,
        rating: item.sellerId?.averageRating || 0,
      }
    }))
  ) : [];
  
  // The backend returns hasMore in pagination
  const lastPageData = data ? data[data.length - 1] : null;
  const hasMore = lastPageData ? lastPageData.pagination?.hasMore : initialHasMore;

  if (additionalListings.length === 0 && !hasMore) return null;

  return (
    <>
      {additionalListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6 pt-6">
          {additionalListings.map((listing: any) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
      
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button 
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore || isValidating}
            className="btn-secondary px-8 py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-all hover:bg-bg-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-border-subtle"
          >
            {isLoadingMore || isValidating ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-text-muted border-t-text-primary animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Items'
            )}
          </button>
        </div>
      )}
    </>
  );
}
