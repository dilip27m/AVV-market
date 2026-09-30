'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function ListingDetails() {
  // Static placeholder data for the UI
  const [activeImage, setActiveImage] = useState(0);
  
  const listing = {
    title: 'Sony WH-1000XM4 Noise Cancelling Headphones',
    price: 15000,
    isNegotiable: true,
    condition: 'Used - Good',
    category: 'Electronics',
    description: 'Selling my Sony headphones. They work perfectly, noise cancellation is top notch. Selling because I upgraded to AirPods Pro. Comes with the original carrying case and aux cable. Slight scratch on the right earcup but nothing major.',
    images: [
      'https://via.placeholder.com/800x600?text=Image+1',
      'https://via.placeholder.com/800x600?text=Image+2',
      'https://via.placeholder.com/800x600?text=Image+3',
    ],
    meetAddress: 'Library Café, Main Campus',
    postedAt: '2 days ago',
    seller: {
      name: 'Rahul Kumar',
      rating: 4.8,
      totalRatings: 12,
      phone: '919876543210' // Needed for WhatsApp link
    }
  };

  const generateWhatsAppLink = () => {
    const text = `Hi ${listing.seller.name}, I'm interested in the "${listing.title}" you listed on CampusMart for ₹${listing.price}. Is it still available?`;
    return `https://wa.me/${listing.seller.phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-6xl mx-auto w-full gap-8 md:flex-row">
        
        {/* Left Column: Images & Description */}
        <div className="flex-1 space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="text-sm text-text-muted flex gap-2">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>›</span>
            <Link href={`/category/${listing.category.toLowerCase()}`} className="hover:text-text-primary">{listing.category}</Link>
            <span>›</span>
            <span className="text-text-primary truncate">{listing.title}</span>
          </nav>

          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full bg-bg-panel rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={listing.images[activeImage]} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {listing.images.map((src, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-brand-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="panel-card space-y-4">
            <h2 className="text-xl font-semibold">Description</h2>
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <span className="px-3 py-1 bg-bg-base border border-border-subtle rounded-full text-text-secondary">
                Condition: {listing.condition}
              </span>
              <span className="px-3 py-1 bg-bg-base border border-border-subtle rounded-full text-text-secondary">
                Category: {listing.category}
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right Column: Sticky Info Panel */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
          <div className="sticky top-20 space-y-6">
            
            {/* Price & Title Card */}
            <div className="panel-card space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              </div>
              
              <div className="flex items-end gap-3 pt-2">
                <span className="text-3xl font-bold text-brand-primary">₹{listing.price.toLocaleString('en-IN')}</span>
                {listing.isNegotiable && (
                  <span className="text-sm text-text-muted mb-1 pb-1 border-b border-border-subtle border-dashed">
                    Negotiable
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted text-right">Posted {listing.postedAt}</p>
            </div>

            {/* Seller & Action Card */}
            <div className="panel-card space-y-6">
              <h3 className="text-lg font-semibold">Seller Info</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary text-white font-bold text-xl rounded-full flex items-center justify-center flex-shrink-0">
                  {listing.seller.name.charAt(0)}
                </div>
                <div>
                  <Link href="/profile/seller-id-placeholder" className="font-semibold text-text-primary hover:underline hover:text-brand-primary">
                    {listing.seller.name}
                  </Link>
                  <p className="text-sm text-text-secondary">
                    ⭐ {listing.seller.rating} ({listing.seller.totalRatings} ratings)
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-t border-border-subtle pt-4">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Meet Address</p>
                <p className="text-sm text-text-primary font-medium">{listing.meetAddress}</p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <a 
                  href={generateWhatsAppLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Subtle Report Button */}
            <div className="flex justify-center pt-2">
              <button className="text-xs text-text-muted hover:text-red-500 transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report this listing
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
