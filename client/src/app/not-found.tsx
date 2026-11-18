import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🧭</div>
        <h1 className="text-3xl font-extrabold mb-2">Page not found</h1>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          The page or item you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className="btn-primary">Back to the marketplace</Link>
      </main>
    </div>
  );
}
