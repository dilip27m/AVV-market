'use client';

import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ListingCardSkeleton';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

interface SellerProfile {
  _id: string;
  name: string;
  profileImage?: string;
  meetAddress?: string;
  averageRating: number;
  totalRatings: number;
  totalItemsSold: number;
  activeListings: number;
  createdAt: string;
}

interface SellerListing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  category: string;
  meetAddress: string;
  sellerName: string;
}

export default function SellerStorefront() {
  const params = useParams();
  const id = params.id as string;

  const { data: seller, error, isLoading } = useSWR<SellerProfile>(`/users/${id}`, fetcher);
  const { data: listings, isLoading: listingsLoading } = useSWR<SellerListing[]>(`/users/${id}/listings`, fetcher);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${seller?.name}'s items on CampusMart`;
    if (navigator.share) {
      navigator.share({ title: text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-2xl font-bold mb-2">Seller not found</h1>
          <Link href="/" className="btn-primary mt-4">Browse listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="panel-card flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
          {isLoading || !seller ? (
            <div className="h-20 animate-pulse bg-bg-hover rounded-2xl w-full" />
          ) : (
            <>
              {seller.profileImage ? (
                <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border-subtle flex-shrink-0">
                  <Image src={seller.profileImage} alt={seller.name} fill sizes="80px" className="object-cover" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-brand-primary flex items-center justify-center text-3xl text-[var(--text-on-brand)] font-bold flex-shrink-0">
                  {seller.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{seller.name}</h1>
                <p className="text-sm text-text-secondary mt-1">
                  ⭐ {seller.averageRating.toFixed(1)} ({seller.totalRatings}) · {seller.totalItemsSold} sold ·{' '}
                  {seller.activeListings} for sale
                </p>
                {seller.meetAddress && <p className="text-sm text-text-muted mt-1">📍 Usually meets at {seller.meetAddress}</p>}
              </div>
              <button onClick={handleShare} className="btn-secondary text-sm self-start sm:self-center">
                Share storefront
              </button>
            </>
          )}
        </div>

        <h2 className="text-xl font-bold mb-6">Items for sale</h2>

        {listingsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((l) => (
              <ListingCard
                key={l._id}
                listing={{
                  ...l,
                  seller: { name: seller?.name || l.sellerName, rating: seller?.averageRating || 0 },
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border-subtle rounded-2xl bg-bg-panel">
            <p className="text-text-muted text-sm">Nothing for sale right now.</p>
          </div>
        )}
      </main>
    </div>
  );
}
