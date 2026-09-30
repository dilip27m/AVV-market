'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LISTING_CATEGORIES } from '@/lib/constants';

export function HomeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<string>(initialSort);

  // Debounce search query updates to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      updateUrl(activeCategory, searchQuery, sortOption);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, activeCategory, sortOption]);

  const updateUrl = (category: string, search: string, sort: string) => {
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (search.trim() !== '') params.set('search', search.trim());
    if (sort !== 'newest') params.set('sort', sort); // keep URL clean by defaulting newest

    // Use router.replace to avoid filling browser history on every keystroke
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Header & Search */}
      <div className="flex flex-col items-center text-center mb-10 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Your Campus Marketplace
        </h1>
        <p className="text-text-secondary mb-8">
          Buy, sell, and discover items exclusively within your college campus. 
        </p>

        <div className="w-full relative shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 sm:py-4 text-base sm:text-lg bg-bg-panel border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-bg-base transition-all"
            placeholder="Search for books, electronics, hostel essentials..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* Categories */}
        <div className="overflow-x-auto pb-2 hide-scrollbar w-full sm:w-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === 'All' 
                  ? 'bg-brand-primary text-[var(--text-on-brand)] border-brand-primary' 
                  : 'bg-bg-panel text-text-secondary border-border-subtle hover:bg-bg-hover'
              }`}
            >
              All Items
            </button>
            {LISTING_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat 
                    ? 'bg-brand-primary text-[var(--text-on-brand)] border-brand-primary' 
                    : 'bg-bg-panel text-text-secondary border-border-subtle hover:bg-bg-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sort Dropdown */}
        <div className="flex-shrink-0">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-bg-panel border border-border-subtle text-text-primary text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </>
  );
}
