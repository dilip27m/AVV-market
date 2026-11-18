'use client';

import { Navbar } from '@/components/Navbar';
import { ListingForm } from '@/components/ListingForm';
import { RequireAuth } from '@/components/RequireAuth';

export default function SellPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col p-6 sm:p-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sell an Item</h1>
        <p className="text-text-secondary mb-8">
          Takes about a minute. Your listing stays live for 30 days.
        </p>
        <RequireAuth>
          <ListingForm />
        </RequireAuth>
      </main>
    </div>
  );
}
