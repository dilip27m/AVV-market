'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchMyListings = async () => {
      try {
        setIsLoading(true);
        const [listingsRes, wishlistRes] = await Promise.all([
          api.get(`/listings?sellerId=${user._id}`),
          api.get('/users/me/wishlist')
        ]);
        setMyListings(listingsRes.data.data.listings || []);
        setWishlist(wishlistRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch user listings', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyListings();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setMyListings(prev => prev.filter(l => l._id !== id));
      toast.success('Listing deleted');
    } catch (error) {
      toast.error('Failed to delete listing.');
    }
  };

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await api.post(`/users/wishlist/${id}`);
      setWishlist(prev => prev.filter(l => l._id !== id));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleMarkSold = async (id: string) => {
    try {
      await api.patch(`/listings/${id}/status`, { status: 'SOLD' });
      setMyListings(prev => prev.map(l => l._id === id ? { ...l, status: 'SOLD' } : l));
      toast.success('Listing marked as sold!');
    } catch (error) {
      toast.error('Failed to update listing status.');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const { data } = await api.patch(`/listings/${id}/renew`);
      setMyListings(prev => prev.map(l => l._id === id ? data.data : l));
      toast.success('Listing renewed for 30 days!');
    } catch (error) {
      toast.error('Failed to renew listing.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">You need to log in to view your profile.</h2>
          <Link href="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const activeListings = myListings.filter(l => l.status === 'ACTIVE' && new Date(l.expiresAt) > new Date());
  const expiredListings = myListings.filter(l => l.status === 'EXPIRED' || (l.status === 'ACTIVE' && new Date(l.expiresAt) <= new Date()));
  const soldListings = myListings.filter(l => l.status === 'SOLD');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 md:p-24 max-w-5xl mx-auto w-full">
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Your Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="panel-card flex items-center gap-6">
              {user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt={user.name} className="h-20 w-20 rounded-full object-cover border border-border-subtle" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-brand-primary flex items-center justify-center text-3xl text-white font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{user.name}</h2>
                <p className="text-text-secondary">{user.email}</p>
                <p className="text-sm text-text-muted mt-1">Phone: {user.phone || 'Not provided'} • Meet at: {user.meetAddress || 'Not provided'}</p>
              </div>
            </div>

            <div className="panel-card space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Your Active Listings ({activeListings.length})</h3>
                <Link href="/sell" className="btn-secondary text-sm px-3 py-1.5">Post New</Link>
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center text-text-muted text-sm">Loading listings...</div>
              ) : activeListings.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border-subtle rounded-xl bg-bg-base">
                  <p className="text-text-muted text-sm mb-4">You don't have any active listings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeListings.map(listing => (
                    <div key={listing._id} className="flex gap-4 py-4 border-b border-border-subtle items-center last:border-0">
                      <div className="w-16 h-16 rounded-md bg-bg-panel overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listing/${listing._id}`} className="font-semibold text-text-primary hover:text-brand-primary truncate block">
                          {listing.title}
                        </Link>
                        <p className="text-sm font-medium text-brand-primary mt-1">₹{listing.price.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button onClick={() => handleMarkSold(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors">
                          Mark Sold
                        </button>
                        <button onClick={() => handleDelete(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {expiredListings.length > 0 && (
              <div className="panel-card space-y-4 opacity-80">
                <h3 className="text-lg font-semibold mb-2">Expired Listings ({expiredListings.length})</h3>
                <div className="space-y-4">
                  {expiredListings.map(listing => (
                    <div key={listing._id} className="flex gap-4 py-4 border-b border-border-subtle items-center last:border-0">
                      <div className="w-16 h-16 rounded-md bg-bg-panel overflow-hidden flex-shrink-0 grayscale">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-text-muted truncate block">
                          {listing.title} (Expired)
                        </span>
                        <p className="text-sm font-medium text-text-muted mt-1">₹{listing.price.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button onClick={() => handleRenew(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg transition-colors border border-brand-primary/20">
                          Renew
                        </button>
                        <button onClick={() => handleDelete(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soldListings.length > 0 && (
              <div className="panel-card space-y-4 opacity-70">
                <h3 className="text-lg font-semibold mb-2">Sold Items ({soldListings.length})</h3>
                <div className="space-y-3">
                  {soldListings.map(listing => (
                    <div key={listing._id} className="flex justify-between py-3 border-b border-border-subtle items-center last:border-0">
                      <span className="text-sm line-through truncate mr-4">{listing.title}</span>
                      <button onClick={() => handleDelete(listing._id)} className="text-xs text-red-500 hover:underline shrink-0">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {wishlist.length > 0 && (
              <div className="panel-card space-y-4">
                <h3 className="text-lg font-semibold mb-2">My Wishlist</h3>
                <div className="space-y-4">
                  {wishlist.map(listing => (
                    <div key={listing._id} className="flex gap-4 py-4 border-b border-border-subtle items-center last:border-0">
                      <div className="w-16 h-16 rounded-md bg-bg-panel overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listing/${listing._id}`} className="font-semibold text-text-primary hover:text-brand-primary truncate block">
                          {listing.title}
                        </Link>
                        <p className="text-sm font-medium text-brand-primary mt-1">₹{listing.price?.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex shrink-0">
                        <button onClick={() => handleRemoveFromWishlist(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-bg-panel text-text-secondary hover:text-red-500 rounded-lg transition-colors border border-border-subtle hover:border-red-200">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-6">
            <div className="panel-card">
              <h3 className="text-lg font-semibold mb-2">Stats</h3>
              <div className="flex justify-between items-center py-3 border-b border-border-subtle">
                <span className="text-text-secondary text-sm">Rating</span>
                <span className="font-medium text-text-primary flex items-center gap-1">
                  ⭐ {user.averageRating?.toFixed(1) || '0.0'} <span className="text-xs text-text-muted font-normal">({user.totalRatings || 0})</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary text-sm">Items Sold</span>
                <span className="font-medium text-text-primary">
                  {soldListings.length || user.totalItemsSold || 0}
                </span>
              </div>
            </div>
            
            <Link href="/profile/edit" className="btn-secondary w-full flex justify-center text-sm py-3">
              Edit Profile details
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
