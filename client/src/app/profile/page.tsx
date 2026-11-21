'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { api, getErrorMessage } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { useConfirm } from '@/context/ConfirmContext';
import { formatPrice, leavingLabel } from '@/lib/format';
import toast from 'react-hot-toast';

interface MyListing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'DELETED';
  expiresAt: string;
}

interface MyRequest {
  _id: string;
  title: string;
  budget?: number | null;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  expiresAt: string;
}

const Thumb = ({ src, muted }: { src?: string; muted?: boolean }) => (
  <div className={`relative w-16 h-16 rounded-md bg-bg-hover overflow-hidden flex-shrink-0 ${muted ? 'grayscale' : ''}`}>
    {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
  </div>
);

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const confirm = useConfirm();
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [listingsRes, requestsRes] = await Promise.all([api.get('/listings/my'), api.get('/wanted/my')]);
        setMyListings(listingsRes.data.data || []);
        setRequests(requestsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch profile data', error);
        toast.error('Could not load your listings. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Only refetch when the logged-in account changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this listing?',
      message: 'Buyers will no longer see it. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/listings/${id}`);
      setMyListings((prev) => prev.filter((l) => l._id !== id));
      toast.success('Listing deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete listing.'));
    }
  };

  const handleRequestStatus = async (id: string, status: MyRequest['status']) => {
    try {
      const { data } = await api.patch(`/wanted/${id}/status`, { status });
      setRequests((prev) => prev.map((r) => (r._id === id ? data.data : r)));
      toast.success(status === 'OPEN' ? 'Request reopened for 30 days' : 'Request closed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update request'));
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const ok = await confirm({ title: 'Delete this request?', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/wanted/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success('Request deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete request'));
    }
  };

  const handleSetStatus = async (id: string, status: 'SOLD' | 'ACTIVE' | 'RESERVED') => {
    try {
      await api.patch(`/listings/${id}/status`, { status });
      setMyListings((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      toast.success(
        status === 'SOLD' ? 'Marked as sold. Congrats! 🎉' : status === 'RESERVED' ? 'Marked as reserved' : 'Listing is live again'
      );
      refreshUser(); // sold counter changed
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update listing status.'));
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const { data } = await api.patch(`/listings/${id}/renew`);
      setMyListings((prev) => prev.map((l) => (l._id === id ? data.data : l)));
      toast.success('Listing renewed for 30 days!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to renew listing.'));
    }
  };

  if (!user) return null;

  const now = new Date();
  const isLive = (l: MyListing) => l.status === 'ACTIVE' || l.status === 'RESERVED';
  const activeListings = myListings.filter((l) => isLive(l) && new Date(l.expiresAt) > now);
  const expiredListings = myListings.filter(
    (l) => l.status === 'EXPIRED' || (isLive(l) && new Date(l.expiresAt) <= now)
  );
  const leaving = leavingLabel(user.leavingDate);
  const soldListings = myListings.filter((l) => l.status === 'SOLD');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main column */}
      <div className="md:col-span-2 space-y-6">
        <div className="panel-card flex items-center gap-6">
          {user.profileImage ? (
            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border-subtle flex-shrink-0">
              <Image src={user.profileImage} alt={user.name} fill sizes="80px" className="object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center text-3xl text-brand-primary font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              {user.name}
              {user.isVerified && <span className="badge bg-brand-soft text-brand-primary">Verified</span>}
            </h2>
            <p className="text-text-secondary truncate">{user.email}</p>
            <p className="text-sm text-text-muted mt-1">
              WhatsApp: {user.phone ? `+91 ${user.phone}` : 'Not added'} • Meet at: {user.meetAddress || 'Not added'}
            </p>
            <Link href={`/seller/${user._id}`} className="text-sm underline text-text-secondary hover:text-text-primary mt-1 inline-block">
              View my public storefront
            </Link>
          </div>
        </div>

        {!user.leavingDate && activeListings.length > 0 && (
          <div className="p-4 rounded-2xl border border-border-subtle bg-bg-panel text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>🎓 Leaving campus soon? Add your date and your items get a countdown badge that helps them sell faster.</span>
            <Link href="/profile/edit" className="font-semibold text-brand-primary whitespace-nowrap">Add date</Link>
          </div>
        )}
        {leaving && (
          <div className="p-4 rounded-2xl bg-warning-soft text-warning text-sm font-medium">
            ⏳ {leaving}. Consider dropping prices on anything still unsold.
          </div>
        )}

        {!user.phone && (
          <div className="p-4 rounded-2xl border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>Add your WhatsApp number so buyers can contact you.</span>
            <Link href="/profile/edit" className="font-semibold underline whitespace-nowrap">Add number</Link>
          </div>
        )}

        {/* Active */}
        <div className="panel-card space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Active Listings ({activeListings.length})</h3>
            <Link href="/sell" className="btn-secondary text-sm px-3 py-1.5">Post New</Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading listings...</div>
          ) : activeListings.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border-subtle rounded-xl bg-bg-base">
              <p className="text-text-muted text-sm mb-4">You don&apos;t have any active listings.</p>
              <Link href="/sell" className="btn-primary text-sm inline-flex">Sell something</Link>
            </div>
          ) : (
            <div>
              {activeListings.map((listing) => (
                <div key={listing._id} className="flex gap-4 py-4 border-b border-border-subtle items-center last:border-0">
                  <Thumb src={listing.images?.[0]} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/listing/${listing._id}`} className="font-semibold text-text-primary hover:text-brand-primary truncate block">
                      {listing.title}
                    </Link>
                    <p className="text-sm font-semibold mt-1">
                      {formatPrice(listing.price)}
                      {listing.status === 'RESERVED' && <span className="ml-2 badge bg-warning-soft text-warning">Reserved</span>}
                    </p>
                    <p className="text-xs text-text-muted">Expires in {daysLeft(listing.expiresAt)} days</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Link href={`/listing/${listing._id}/edit`} className="px-3 py-1.5 text-xs font-medium text-center bg-bg-base border border-border-subtle hover:bg-bg-hover rounded-lg transition-colors">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleSetStatus(listing._id, listing.status === 'RESERVED' ? 'ACTIVE' : 'RESERVED')}
                      className="px-3 py-1.5 text-xs font-medium bg-warning-soft text-warning hover:opacity-80 rounded-lg transition-colors"
                    >
                      {listing.status === 'RESERVED' ? 'Unreserve' : 'Reserve'}
                    </button>
                    <button onClick={() => handleSetStatus(listing._id, 'SOLD')} className="px-3 py-1.5 text-xs font-medium bg-success-soft text-success hover:opacity-80 rounded-lg transition-colors">
                      Mark sold
                    </button>
                    <button onClick={() => handleDelete(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-danger-soft text-danger hover:opacity-80 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expired */}
        {expiredListings.length > 0 && (
          <div className="panel-card space-y-4">
            <h3 className="text-lg font-semibold mb-2">Expired ({expiredListings.length})</h3>
            <p className="text-sm text-text-muted -mt-2">Hidden from buyers. Renew to put them back up for 30 days.</p>
            <div>
              {expiredListings.map((listing) => (
                <div key={listing._id} className="flex gap-4 py-4 border-b border-border-subtle items-center last:border-0">
                  <Thumb src={listing.images?.[0]} muted />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-text-muted truncate block">{listing.title}</span>
                    <p className="text-sm font-medium text-text-muted mt-1">₹{listing.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button onClick={() => handleRenew(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-brand-primary text-[var(--text-on-brand)] hover:bg-brand-hover rounded-lg transition-colors">
                      Renew
                    </button>
                    <button onClick={() => handleDelete(listing._id)} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sold */}
        {soldListings.length > 0 && (
          <div className="panel-card space-y-4">
            <h3 className="text-lg font-semibold mb-2">Sold ({soldListings.length})</h3>
            <div>
              {soldListings.map((listing) => (
                <div key={listing._id} className="flex justify-between py-3 border-b border-border-subtle items-center last:border-0 gap-4">
                  <Link href={`/listing/${listing._id}`} className="text-sm text-text-muted line-through truncate hover:text-text-primary">
                    {listing.title}
                  </Link>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => handleSetStatus(listing._id, 'ACTIVE')} className="text-xs text-text-secondary hover:underline">
                      Mark available
                    </button>
                    <button onClick={() => handleDelete(listing._id)} className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wanted requests */}
        <div className="panel-card space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Your Wanted requests ({requests.filter((r) => r.status === 'OPEN').length} open)</h3>
            <Link href="/wanted" className="btn-secondary text-sm px-3 py-1.5">Wanted board</Link>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-text-muted">
              Looking for something nobody&apos;s selling? <Link href="/wanted" className="underline hover:text-text-primary">Post a request</Link> and sellers will reach out.
            </p>
          ) : (
            <div>
              {requests.map((req) => {
                const expired = req.status === 'OPEN' && new Date(req.expiresAt) <= new Date();
                const live = req.status === 'OPEN' && !expired;
                return (
                  <div key={req._id} className="flex gap-4 py-3 border-b border-border-subtle items-center last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${live ? '' : 'text-text-muted'}`}>{req.title}</p>
                      <p className="text-xs text-text-muted">
                        {live ? `Open · expires in ${daysLeft(req.expiresAt)} days` : expired ? 'Expired' : req.status === 'FULFILLED' ? 'Found it 🎉' : 'Closed'}
                        {req.budget != null && ` · budget ₹${req.budget.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0 text-xs">
                      {live ? (
                        <button onClick={() => handleRequestStatus(req._id, 'FULFILLED')} className="font-semibold text-success hover:underline">Found it</button>
                      ) : (
                        <button onClick={() => handleRequestStatus(req._id, 'OPEN')} className="font-semibold text-brand-primary hover:underline">Reopen</button>
                      )}
                      <button onClick={() => handleDeleteRequest(req._id)} className="text-text-muted hover:text-danger">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="panel-card">
          <h3 className="text-lg font-semibold mb-2">Stats</h3>
          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-text-secondary text-sm">Rating</span>
            <span className="font-medium text-text-primary flex items-center gap-1">
              ⭐ {user.averageRating?.toFixed(1) || '0.0'}{' '}
              <span className="text-xs text-text-muted font-normal">({user.totalRatings || 0})</span>
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-text-secondary text-sm">Items Sold</span>
            <span className="font-medium text-text-primary">{user.totalItemsSold || soldListings.length || 0}</span>
          </div>
        </div>

        <Link href="/saved" className="btn-secondary w-full flex justify-center text-sm py-3">
          ♡ Saved items
        </Link>
        <Link href="/profile/edit" className="btn-secondary w-full flex justify-center text-sm py-3">
          Edit profile details
        </Link>
        {user.isAdmin && (
          <Link href="/admin" className="btn-secondary w-full flex justify-center text-sm py-3">
            Admin dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col p-6 sm:p-12 md:p-16 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Profile</h1>
        <RequireAuth>
          <ProfileContent />
        </RequireAuth>
      </main>
    </div>
  );
}
