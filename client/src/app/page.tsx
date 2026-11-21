import Link from 'next/link';
import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { HomeFilters } from '@/components/HomeFilters';
import { LoadMoreListings } from '@/components/LoadMoreListings';
import { ListingSummary } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const PASSTHROUGH = ['category', 'search', 'sort', 'condition', 'minPrice', 'maxPrice', 'free', 'includeSold', 'status'] as const;

interface Stats {
  liveListings: number;
  sellers: number;
  soldThisMonth: number;
  freeItems: number;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch (err) {
    console.error('Fetch failed:', url, err);
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;

  const query = new URLSearchParams();
  for (const key of PASSTHROUGH) {
    const value = resolved[key];
    if (typeof value === 'string' && value) query.set(key, value);
  }
  const queryString = query.toString();
  const isFiltered = queryString.length > 0 && !(query.size === 1 && query.get('sort'));

  const [feed, stats] = await Promise.all([
    getJson<{ listings: ListingSummary[]; pagination: { total: number; hasMore: boolean } }>(
      `${API_URL}/listings?${queryString}`
    ),
    isFiltered ? Promise.resolve(null) : getJson<Stats>(`${API_URL}/listings/stats`),
  ]);

  const listings = feed?.listings || [];
  const total = feed?.pagination.total ?? 0;

  const heading = query.get('free')
    ? 'Free stuff 🎁'
    : query.get('search')
      ? `Results for “${query.get('search')}”`
      : query.get('includeSold')
        ? 'All items (including sold out)'
        : query.get('category') || 'Fresh on campus';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {/* Hero (only on the unfiltered home page) */}
        {!isFiltered && (
          <section className="relative overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-panel px-5 py-7 sm:px-12 sm:py-14 mb-6 sm:mb-8 [box-shadow:var(--shadow-card)]">
            <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-brand-primary/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-warning/10 blur-3xl" aria-hidden="true" />
            <div className="relative max-w-2xl space-y-5">
              <span className="chip !bg-brand-soft !text-brand-primary !border-transparent">🎓 Farewell season is here</span>
              <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-balance">
                Seniors are leaving.
                <br />
                <span className="text-brand-primary">Their stuff doesn&apos;t have to.</span>
              </h1>
              <p className="hidden sm:block text-text-secondary text-lg max-w-xl">
                Buy textbooks, cycles, mattresses and more from students on your campus. Meet up, check it out, pay in cash or UPI.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
                <Link href="/sell" className="btn-primary text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-3">Sell your stuff</Link>
                <Link href="/wanted" className="btn-secondary text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-3">Post what you need</Link>
              </div>
            </div>

            {stats && stats.liveListings > 0 && (
              <dl className="relative mt-6 sm:mt-10 grid grid-cols-3 gap-4 max-w-lg">
                {[
                  { label: 'Items for sale', value: stats.liveListings },
                  { label: 'Sellers', value: stats.sellers },
                  { label: 'Sold this month', value: stats.soldThisMonth },
                ].map((s) => (
                  <div key={s.label}>
                    <dd className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-display)]">{s.value}</dd>
                    <dt className="text-xs sm:text-sm text-text-muted">{s.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}

        <Suspense fallback={<div className="h-28" />}>
          <HomeFilters />
        </Suspense>

        <div className="mt-8 mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-extrabold">{heading}</h2>
          {feed && <span className="text-sm text-text-muted shrink-0">{total} {total === 1 ? 'item' : 'items'}</span>}
        </div>

        {!feed ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border-subtle">
            <p className="text-lg font-semibold mb-1">Couldn&apos;t load listings</p>
            <p className="text-sm text-text-muted mb-6">The server might be waking up. Give it a few seconds.</p>
            <Link href={queryString ? `/?${queryString}` : '/'} className="btn-secondary">Try again</Link>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {listings.map((listing, i) => (
                <ListingCard key={listing._id} listing={listing} priority={i < 4} />
              ))}
            </div>
            <LoadMoreListings
              key={queryString}
              query={queryString}
              lastListingId={listings[listings.length - 1]?._id}
              initialHasMore={feed.pagination.hasMore}
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
      </main>
    </div>
  );
}
