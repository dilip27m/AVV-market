'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ListingForm, ExistingListing } from '@/components/ListingForm';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

function EditListingContent({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: listing, error, isLoading } = useSWR<ExistingListing & { sellerId: { _id: string } | string; status: string }>(
    `/listings/${id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin" />
      </div>
    );
  }

  const sellerId = typeof listing?.sellerId === 'string' ? listing.sellerId : listing?.sellerId?._id;

  if (error || !listing || listing.status === 'DELETED' || sellerId !== user?._id) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">You can’t edit this listing</h2>
        <p className="text-text-muted mb-6">It may have been removed, or it belongs to someone else.</p>
        <Link href="/profile" className="btn-primary inline-flex">Go to my listings</Link>
      </div>
    );
  }

  return <ListingForm listing={listing} />;
}

export default function EditListingPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col p-6 sm:p-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Listing</h1>
        <RequireAuth>
          <EditListingContent id={id} />
        </RequireAuth>
      </main>
    </div>
  );
}
