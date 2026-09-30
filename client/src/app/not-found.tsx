import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-8xl font-black text-text-muted mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-8">
          The item or page you're looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <Link 
          href="/" 
          className="btn-primary"
        >
          Return Home
        </Link>
      </main>
    </div>
  );
}
