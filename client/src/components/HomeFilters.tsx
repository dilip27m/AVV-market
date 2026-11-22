'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_ICONS, ITEM_CONDITIONS, LISTING_CATEGORIES, SORT_OPTIONS } from '@/lib/constants';

interface Filters {
  category: string;
  search: string;
  sort: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  free: string;
  includeSold: string;
}

const EMPTY_EXTRAS = { condition: '', minPrice: '', maxPrice: '', free: '', includeSold: '' };

const readFilters = (params: URLSearchParams): Filters => ({
  category: params.get('category') || '',
  search: params.get('search') || '',
  sort: params.get('sort') || 'newest',
  condition: params.get('condition') || '',
  minPrice: params.get('minPrice') || '',
  maxPrice: params.get('maxPrice') || '',
  free: params.get('free') || '',
  includeSold: params.get('includeSold') || '',
});

const toQuery = (f: Filters) => {
  const params = new URLSearchParams();
  if (f.category) params.set('category', f.category);
  if (f.search.trim()) params.set('search', f.search.trim());
  if (f.sort && f.sort !== 'newest') params.set('sort', f.sort);
  if (f.condition) params.set('condition', f.condition);
  if (f.includeSold) params.set('includeSold', '1');
  if (f.free) {
    params.set('free', '1');
  } else {
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
  }
  return params.toString();
};

const pill = (active: boolean) =>
  `flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
    active
      ? 'bg-text-primary text-bg-base border-text-primary'
      : 'bg-bg-panel text-text-secondary border-border-subtle hover:border-text-muted hover:text-text-primary'
  }`;

const option = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm border transition-colors ${
    active ? 'border-brand-primary bg-brand-soft text-brand-primary font-semibold' : 'border-border-subtle hover:bg-bg-hover'
  }`;

export function HomeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => readFilters(searchParams));
  const [showSheet, setShowSheet] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);

  const set = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }));

  // Keep state in sync with URL search params if user navigates back/forward or resets
  useEffect(() => {
    setFilters(readFilters(searchParams));
  }, [searchParams]);

  // Debounce filter changes into the URL and refresh the route
  useEffect(() => {
    const handler = setTimeout(() => {
      const next = toQuery(filters);
      if (next === searchParams.toString()) return;
      router.replace(next ? `/?${next}` : '/', { scroll: false });
      router.refresh();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters, router, searchParams]);

  useEffect(() => {
    const dialog = sheetRef.current;
    if (!dialog) return;
    if (showSheet && !dialog.open) dialog.showModal();
    if (!showSheet && dialog.open) dialog.close();
  }, [showSheet]);

  const extraFilterCount = [filters.condition, filters.minPrice || filters.maxPrice, filters.free].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          aria-label="Search listings"
          className="w-full !pl-12 !pr-32 !py-4 text-base !rounded-2xl !bg-bg-panel [box-shadow:var(--shadow-card)]"
          placeholder="Search for anything..."
        />
        <button
          onClick={() => setShowSheet(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-hover"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
          </svg>
          Filters
          {extraFilterCount > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-brand-primary text-[11px] font-bold flex items-center justify-center" style={{ color: 'var(--text-on-brand)' }}>
              {extraFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Categories + sort */}
      <div className="flex items-center gap-3">
        <div className="flex-1 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 w-max pb-1">
            <button onClick={() => set({ category: '', free: '' })} aria-pressed={!filters.category && !filters.free} className={pill(!filters.category && !filters.free)}>
              <span aria-hidden="true">🛍️</span> All
            </button>
            <button onClick={() => set({ free: filters.free ? '' : '1', minPrice: '', maxPrice: '' })} aria-pressed={!!filters.free} className={pill(!!filters.free)}>
              <span aria-hidden="true">🎁</span> Free
            </button>
            <Link href="/sold" className={pill(false)}>
              <span aria-hidden="true">🏷️</span> Sold History
            </Link>
            {LISTING_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => set({ category: filters.category === cat ? '' : cat })} aria-pressed={filters.category === cat} className={pill(filters.category === cat)}>
                <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span> {cat}
              </button>
            ))}
          </div>
        </div>
        <select
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value })}
          aria-label="Sort listings"
          className="hidden sm:block shrink-0 !py-2 !rounded-full text-sm cursor-pointer !bg-bg-panel"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filter sheet (bottom sheet on phones, centred dialog on desktop) */}
      <dialog
        ref={sheetRef}
        onClose={() => setShowSheet(false)}
        onClick={(e) => e.target === sheetRef.current && setShowSheet(false)}
        className="mb-0 mt-auto sm:m-auto w-full max-w-none sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => set({ ...EMPTY_EXTRAS, sort: 'newest' })} className="text-sm text-text-muted hover:text-text-primary underline">
              Reset
            </button>
          </div>

          <div className="space-y-2 sm:hidden">
            <p className="text-sm font-semibold">Sort by</p>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => set({ sort: o.value })} className={option(filters.sort === o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Condition</p>
            <div className="flex flex-wrap gap-2">
              {['', ...ITEM_CONDITIONS].map((c) => (
                <button key={c || 'any'} onClick={() => set({ condition: c })} className={option(filters.condition === c)}>
                  {c || 'Any'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Price (₹)</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!filters.free} onChange={(e) => set({ free: e.target.checked ? '1' : '' })} className="h-4 w-4" />
              Free items only
            </label>
            <div className={`flex items-center gap-3 ${filters.free ? 'opacity-40 pointer-events-none' : ''}`}>
              <input type="number" inputMode="numeric" min={0} placeholder="Min" value={filters.minPrice} onChange={(e) => set({ minPrice: e.target.value })} className="w-full" aria-label="Minimum price" />
              <span className="text-text-muted">–</span>
              <input type="number" inputMode="numeric" min={0} placeholder="Max" value={filters.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} className="w-full" aria-label="Maximum price" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000].map((max) => (
                <button key={max} onClick={() => set({ free: '', minPrice: '', maxPrice: String(max) })} className="chip hover:border-text-muted">
                  Under ₹{max.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <p className="text-sm font-semibold">Availability</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters.includeSold}
                onChange={(e) => set({ includeSold: e.target.checked ? '1' : '' })}
                className="h-4 w-4 rounded"
              />
              Include sold items in results
            </label>
          </div>

          <button onClick={() => setShowSheet(false)} className="btn-primary w-full">
            Show results
          </button>
        </div>
      </dialog>
    </div>
  );
}
