'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { LISTING_CATEGORIES } from '@/lib/constants';
import { api } from '@/lib/api';

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  category: string;
  meetAddress: string;
  sellerId?: {
    name: string;
    averageRating: number;
  };
  sellerName: string;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.append('category', activeCategory);
        if (debouncedSearch) params.append('search', debouncedSearch);
        params.append('sort', sortOption);
        
        const { data } = await api.get(`/listings?${params.toString()}`);
        setListings(data.data.listings || []);
      } catch (err: any) {
        setError('Failed to load listings.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, [activeCategory, debouncedSearch, sortOption]);

  const formattedListings = listings.map(item => ({
    ...item,
    seller: {
      name: item.sellerId?.name || item.sellerName,
      rating: item.sellerId?.averageRating || 0,
    }
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full">
        
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
          {/* Categories (Scrollable Pills) */}
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

        {/* Listings Grid */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {activeCategory === 'All' ? 'Recently Listed' : `${activeCategory}`}
          </h2>
          <span className="text-sm text-text-muted">{formattedListings.length} results</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">Loading items...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : formattedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {formattedListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border-subtle rounded-2xl bg-bg-panel">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-1">No items found</h3>
            <p className="text-text-muted text-sm">
              We couldn't find any listings matching your search.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="mt-4 text-brand-primary font-medium hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
