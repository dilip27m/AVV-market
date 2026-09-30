import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function Profile() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 md:p-24 max-w-4xl mx-auto w-full">
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Your Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="panel-card flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-brand-primary flex items-center justify-center text-3xl text-white font-bold">
                J
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">John Doe</h2>
                <p className="text-text-secondary">john.doe@example.com</p>
                <p className="text-sm text-text-muted mt-1">Hostel: Block A, Room 102</p>
              </div>
            </div>

            <div className="panel-card">
              <h3 className="text-lg font-semibold mb-4">Your Listings</h3>
              <p className="text-text-muted text-sm">You haven't posted any listings yet.</p>
              <Link href="/sell" className="btn-secondary inline-flex mt-4">
                Post an Item
              </Link>
            </div>
          </div>

          {/* Sidebar / Stats / QR */}
          <div className="space-y-6">
            <div className="panel-card">
              <h3 className="text-lg font-semibold mb-2">Stats</h3>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Rating</span>
                <span className="font-medium text-text-primary">⭐ 4.8</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary">Items Sold</span>
                <span className="font-medium text-text-primary">3</span>
              </div>
            </div>
        </div>

      </main>
    </div>
  );
}
