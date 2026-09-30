'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { LISTING_CATEGORIES } from '@/lib/constants';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for initial UI viewing
  const mockListings = [
    {
      _id: '1',
      title: 'Sony WH-1000XM4 Noise Cancelling Headphones',
      price: 15000,
      images: ['https://via.placeholder.com/400x300?text=Headphones'],
      condition: 'Used - Good',
      category: 'Electronics',
      meetAddress: 'Library Café, Main Campus',
      seller: { name: 'Rahul K.', rating: 4.8 }
    },
    {
      _id: '2',
      title: 'Engineering Mathematics Vol 1',
      price: 350,
      images: ['https://via.placeholder.com/400x300?text=Book'],
      condition: 'Like New',
      category: 'Books',
      meetAddress: 'Block A, Room 102',
      seller: { name: 'Amit S.', rating: 4.2 }
    },
    {
      _id: '3',
      title: 'Hercules Roadeo Cycle',
      price: 4500,
      images: ['https://via.placeholder.com/400x300?text=Cycle'],
      condition: 'Used - Fair',
      category: 'Cycles',
      meetAddress: 'Main Gate Parking',
      seller: { name: 'Priya M.', rating: 5.0 }
    },
    {
      _id: '4',
      title: 'Study Table Lamp',
      price: 250,
      images: ['https://via.placeholder.com/400x300?text=Lamp'],
      condition: 'New',
      category: 'Hostel Essentials',
      meetAddress: 'Block C Reception',
      seller: { name: 'Neha V.', rating: 4.5 }
    }
  ];

  // Simple filter for the mock data
  const filteredListings = mockListings.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

        {/* Categories (Scrollable Pills) */}
        <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === 'All' 
                  ? 'bg-brand-primary text-white border-brand-primary' 
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
                    ? 'bg-brand-primary text-white border-brand-primary' 
                    : 'bg-bg-panel text-text-secondary border-border-subtle hover:bg-bg-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {activeCategory === 'All' ? 'Recently Listed' : `${activeCategory}`}
          </h2>
          <span className="text-sm text-text-muted">{filteredListings.length} results</span>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
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
