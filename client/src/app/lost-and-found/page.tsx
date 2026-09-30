'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data.data.items || []);

interface MissingItem {
  _id: string;
  title: string;
  description: string;
  lastSeenLocation: string;
  images: string[];
  status: string;
  createdAt: string;
  reporterId: {
    name: string;
    phone: string;
  };
}

export default function LostAndFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: items = [], error, isLoading } = useSWR<MissingItem[]>('/missing-items', fetcher);

  const getWhatsAppLink = (phone?: string, text?: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text || '')}`;
  };

  const filteredItems = items.filter(item => 
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 md:p-24 max-w-5xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Lost & Found
            </h1>
            <p className="text-text-secondary">
              Check if an item you're buying was reported stolen, or report something you lost.
            </p>
          </div>
          <Link href="/lost-and-found/report" className="btn-primary whitespace-nowrap">
            Report Missing Item
          </Link>
        </div>

        {/* Search */}
        <div className="w-full relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-bg-panel border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-bg-base transition-all"
            placeholder="Search by item name, model, or description..."
          />
        </div>

        {/* Items List */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item._id} className="panel-card flex flex-col gap-4">
                {item.images && item.images.length > 0 && (
                  <div className="w-full h-48 rounded-lg overflow-hidden -mt-2 -mx-2 mb-2 bg-bg-base">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">MISSING</span>
                  <span className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-3 mt-1">
                    {item.description}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-border-subtle">
                  <p className="text-sm mb-3">
                    <span className="text-text-muted">Last seen:</span> {item.lastSeenLocation}
                  </p>
                  <a 
                    href={getWhatsAppLink(item.reporterId?.phone, `Hi ${item.reporterId?.name || ''}, I might have found the "${item.title}" you reported missing on CampusMart.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full text-sm flex justify-center items-center"
                  >
                    Contact Reporter
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border-subtle rounded-2xl bg-bg-panel">
            <h3 className="text-lg font-semibold mb-1">No missing items</h3>
            <p className="text-text-muted text-sm">
              Either your campus is very safe, or nothing matches your search!
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
