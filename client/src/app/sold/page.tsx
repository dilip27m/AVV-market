'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { ListingGridSkeleton } from '@/components/ListingCardSkeleton';
import { api } from '@/lib/api';
import { ListingSummary } from '@/lib/types';
import { CATEGORY_ICONS, LISTING_CATEGORIES } from '@/lib/constants';

interface ListingsResponse {
  listings: ListingSummary[];
  pagination: {
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const fetcher = (url: string) => api.get(url).then((res) => res.data.data as ListingsResponse);

export default function SoldPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const queryParams = new URLSearchParams({
    status: 'SOLD',
    limit: '40',
  });
  if (selectedCategory) queryParams.set('category', selectedCategory);
  if (search.trim()) queryParams.set('search', search.trim());

  const { data, isLoading } = useSWR<ListingsResponse>(
    `/listings?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  );

  const listings = data?.listings || [];
  const total = data?.pagination?.total ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-text-muted flex items-center gap-2 mb-4">
          <Link href="/" className="hover:text-text-primary">Home</Link>
          <span aria-hidden="true">›</span>
          <span className="text-text-primary">Sold History</span>
        </nav>

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-panel p-6 sm:p-10 mb-8 [box-shadow:var(--shadow-card)]">
          <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-hover text-text-secondary text-xs font-semibold border border-border-subtle">
              <span>🏷️</span>
              <span>Campus Trade Archive</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Sold Out History
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Browse items that have successfully found new owners on campus. Check past prices, completed deals, and campus selling trends.
            </p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sold items..."
              className="w-full !pl-10 !py-2.5 text-sm !rounded-xl !bg-bg-panel border border-border-subtle"
            />
          </div>

          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 w-max pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                  !selectedCategory
                    ? 'bg-text-primary text-bg-base border-text-primary'
                    : 'bg-bg-panel text-text-secondary border-border-subtle hover:text-text-primary'
                }`}
              >
                <span>🛍️</span> All Categories
              </button>
              {LISTING_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                    selectedCategory === cat
                      ? 'bg-text-primary text-bg-base border-text-primary'
                      : 'bg-bg-panel text-text-secondary border-border-subtle hover:text-text-primary'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span> {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm text-text-muted">
            {isLoading ? 'Loading sold items...' : `${total} item${total === 1 ? '' : 's'} sold`}
          </p>
          <Link href="/" className="text-xs sm:text-sm text-brand-primary font-semibold hover:underline">
            View items for sale →
          </Link>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <ListingGridSkeleton count={8} />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {listings.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="py-20 px-6 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
            <div className="text-5xl mb-4" aria-hidden="true">🏷️</div>
            <h2 className="text-lg font-bold mb-1">No sold items found</h2>
            <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
              {search || selectedCategory
                ? 'Try clearing your search or category filter to see other sold items.'
                : 'Items marked as “Sold” by sellers on campus will automatically appear in this history archive.'}
            </p>
            <div className="flex justify-center gap-3">
              {(search || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                  }}
                  className="btn-secondary text-sm"
                >
                  Clear filters
                </button>
              )}
              <Link href="/" className="btn-primary text-sm">
                Browse items for sale
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
