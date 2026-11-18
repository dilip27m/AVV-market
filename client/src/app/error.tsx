'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">😵‍💫</div>
        <h1 className="text-3xl font-extrabold mb-2">Something went wrong</h1>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          We hit an unexpected error. Try again, or head back to the homepage.
        </p>
        <div className="flex gap-3">
          <button onClick={() => reset()} className="btn-primary">Try again</button>
          <Link href="/" className="btn-secondary">Home</Link>
        </div>
      </main>
    </div>
  );
}
