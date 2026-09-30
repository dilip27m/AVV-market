import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 max-w-4xl mx-auto w-full text-center mt-[-4rem]">
        
        {/* Main Hero Header (ChatGPT style large clean text) */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Your Campus Marketplace
        </h1>
        <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
          Buy, sell, and discover items exclusively within your college campus. 
          No delivery fees, no strangers.
        </p>

        {/* Sleek Search Bar */}
        <div className="w-full max-w-2xl relative mb-12 shadow-sm mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-4 text-lg bg-bg-panel border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-bg-base transition-all"
            placeholder="Search for books, electronics, hostel essentials..."
          />
        </div>

        {/* Minimal Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mx-auto text-left">
          {['Books', 'Electronics', 'Cycles', 'Hostel Essentials'].map((cat) => (
            <Link key={cat} href={`/category/${cat.toLowerCase()}`} className="panel-card hover:bg-bg-hover transition-colors cursor-pointer p-4 group">
              <span className="block font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                {cat}
              </span>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
