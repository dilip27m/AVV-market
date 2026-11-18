'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { RequireAuth } from '@/components/RequireAuth';
import { ListingCard } from '@/components/ListingCard';
import { ListingGridSkeleton } from '@/components/ListingCardSkeleton';
import { api } from '@/lib/api';
import { ListingSummary } from '@/lib/types';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data as ListingSummary[]);

function SavedItems() {
  // Same key as useWishlist, so un-saving a card removes it here instantly
  const { data: items, isLoading } = useSWR('/users/me/wishlist', fetcher);

  if (isLoading || !items) return <ListingGridSkeleton count={4} />;

  // Still-available items first, sold ones at the end
  const available = items.filter((i) => i.status !== 'SOLD' && i.title);
  const sold = items.filter((i) => i.status === 'SOLD' && i.title);

  if (available.length + sold.length === 0) {
    return (
      <div className="py-20 px-6 text-center rounded-3xl border border-dashed border-border-subtle bg-bg-panel">
        <div className="text-5xl mb-4" aria-hidden="true">🤍</div>
        <h2 className="text-lg font-bold mb-1">Nothing saved yet</h2>
        <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
          Tap the heart on any item to keep an eye on it. You&apos;ll find it here when you&apos;re ready to buy.
        </p>
        <Link href="/" className="btn-primary">Browse items</Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {available.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {available.map((item) => (
            <ListingCard key={item._id} listing={item} />
          ))}
        </div>
      )}
      {sold.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 text-text-muted">Already sold</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {sold.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Saved items</h1>
        <p className="text-text-secondary mb-8">Things you&apos;re keeping an eye on.</p>
        <RequireAuth>
          <SavedItems />
        </RequireAuth>
      </main>
    </div>
  );
}
