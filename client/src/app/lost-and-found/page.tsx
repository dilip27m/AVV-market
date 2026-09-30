import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function LostAndFound() {
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
            className="w-full pl-11 pr-4 py-3 bg-bg-panel border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-bg-base transition-all"
            placeholder="Search by item name, model, or description..."
          />
        </div>

        {/* Missing Items List Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Item Card */}
          <div className="panel-card flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-400">MISSING</span>
              <span className="text-xs text-text-muted">Reported 2 days ago</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-text-primary">Black Casio G-Shock</h3>
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                Lost my watch near the library or cafeteria. It has a slight scratch on the screen.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-border-subtle">
              <p className="text-sm">
                <span className="text-text-muted">Last seen:</span> Main Library
              </p>
              <button className="btn-secondary w-full mt-4 text-sm">
                Contact Reporter
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
