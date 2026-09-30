'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ListingDetails() {
  const params = useParams();
  const id = params.id as string;

  const [activeImage, setActiveImage] = useState(0);
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const [listingRes, commentsRes] = await Promise.all([
          api.get(`/listings/${id}`),
          api.get(`/comments/${id}`)
        ]);
        setListing(listingRes.data.data);
        setComments(commentsRes.data.data || []);
        
        if (user) {
          try {
            const wishlistRes = await api.get('/users/me/wishlist');
            const wishlistIds = wishlistRes.data.data.map((item: any) => item._id || item);
            setIsSaved(wishlistIds.includes(id));
          } catch (e) {
            // Ignore wishlist fetch error quietly
          }
        }
      } catch (err) {
        console.error(err);
        setError('Listing not found or failed to load.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-base">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-border-subtle border-t-brand-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-base">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-text-muted">{error || 'Something went wrong.'}</p>
          <Link href="/" className="mt-4 btn-primary">Go Back Home</Link>
        </div>
      </div>
    );
  }

  // Format posted At (simple relative time placeholder since createdAt is a Date string)
  const postedAt = new Date(listing.createdAt).toLocaleDateString();

  const generateWhatsAppLink = () => {
    let sellerPhone = listing.sellerId?.phone || listing.sellerPhone;
    if (sellerPhone) {
      // Strip all non-digits
      sellerPhone = sellerPhone.replace(/\D/g, '');
      // If it's a 10 digit Indian number, prefix with 91
      if (sellerPhone.length === 10) {
        sellerPhone = `91${sellerPhone}`;
      }
    }
    const sellerName = listing.sellerId?.name || listing.sellerName;
    const text = `Hi ${sellerName}, I'm interested in the "${listing.title}" you listed on CampusMart for ₹${listing.price}. Is it still available?`;
    return `https://wa.me/${sellerPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      const { data } = await api.post(`/comments/${id}`, { text: newComment });
      setComments((prev) => [...prev, data.data]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment', err);
      toast.error('Failed to delete comment.');
    }
  };
  const handleRateSeller = async (rating: number) => {
    if (!user) {
      toast.error('You must be logged in to rate sellers.');
      return;
    }
    try {
      const res = await api.post(`/users/${listing.sellerId._id}/rate`, { rating });
      toast.success('Thanks for rating this seller!');
      setListing((prev: any) => ({
        ...prev,
        sellerId: {
          ...prev.sellerId,
          averageRating: res.data.data.averageRating,
          totalRatings: res.data.data.totalRatings,
        }
      }));
    } catch (err) {
      toast.error('Failed to rate seller.');
    }
  };

  const handleReportListing = async () => {
    if (!user) {
      toast.error('You must be logged in to report a listing.');
      return;
    }
    const reason = window.prompt('Reason for reporting? (e.g. SPAM, WRONG_INFO, ALREADY_SOLD, INAPPROPRIATE, OTHER)');
    if (!reason) return;
    
    // Convert human readable to ENUM if they didn't type it exact (fallback to OTHER)
    const validReasons = ['SPAM', 'WRONG_INFO', 'ALREADY_SOLD', 'INAPPROPRIATE', 'OTHER'];
    const formattedReason = validReasons.includes(reason.toUpperCase()) ? reason.toUpperCase() : 'OTHER';

    try {
      await api.post('/reports', {
        listingId: listing._id,
        reason: formattedReason,
        description: reason,
      });
      toast.success('Listing reported to moderators. Thank you.');
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('You have already reported this listing.');
      } else {
        toast.error('Failed to report listing.');
      }
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save listings.');
      return;
    }
    
    // Optimistic UI update
    setIsSaved(!isSaved);
    
    try {
      const res = await api.post(`/users/wishlist/${id}`);
      if (res.data.data.added) {
        toast.success('Added to Wishlist!');
      } else {
        toast.success('Removed from Wishlist.');
      }
    } catch (error) {
      // Revert on failure
      setIsSaved(!isSaved);
      toast.error('Failed to update wishlist.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out this ${listing.title} on CampusMart!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-bg-base">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 sm:p-8 md:p-12 max-w-6xl mx-auto w-full gap-8 md:flex-row">
        
        {/* Left Column: Images & Description */}
        <div className="flex-1 space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="text-sm text-text-muted flex gap-2">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>›</span>
            <Link href={`/category/${listing.category.toLowerCase()}`} className="hover:text-text-primary">{listing.category}</Link>
            <span>›</span>
            <span className="text-text-primary truncate">{listing.title}</span>
          </nav>

          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full bg-bg-panel rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={listing.images[activeImage]} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {listing.images.map((src: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-brand-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="panel-card space-y-4">
            <h2 className="text-xl font-semibold">Description</h2>
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <span className="px-3 py-1 bg-bg-base border border-border-subtle rounded-full text-text-secondary">
                Condition: {listing.condition}
              </span>
              <span className="px-3 py-1 bg-bg-base border border-border-subtle rounded-full text-text-secondary">
                Category: {listing.category}
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Comments Section */}
          <div className="panel-card space-y-6">
            <h2 className="text-xl font-semibold border-b border-border-subtle pb-4">
              Questions & Comments ({comments.length})
            </h2>

            {/* Comment List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-[var(--text-on-brand)] flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {comment.userName.charAt(0)}
                    </div>
                    <div className="flex-1 bg-bg-base border border-border-subtle rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">{comment.userName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {user && user._id === comment.userId && (
                            <button 
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-border-subtle">
                <div className="w-8 h-8 rounded-full bg-brand-primary text-[var(--text-on-brand)] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question about this item..."
                    className="w-full text-sm"
                    maxLength={1000}
                    disabled={isSubmittingComment}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="btn-primary text-sm px-4 whitespace-nowrap"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-4 border-t border-border-subtle text-center">
                <p className="text-sm text-text-muted mb-2">You must be logged in to ask a question.</p>
                <Link href="/login" className="btn-secondary text-sm inline-block">
                  Log in to Comment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Info Panel */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
          <div className="sticky top-20 space-y-6">
            
            {/* Price & Title Card */}
            <div className="panel-card space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              </div>
              
              <div className="flex items-end gap-3 pt-2">
                <span className="text-3xl font-bold text-brand-primary">₹{listing.price.toLocaleString('en-IN')}</span>
                {listing.isNegotiable && (
                  <span className="text-sm text-text-muted mb-1 pb-1 border-b border-border-subtle border-dashed">
                    Negotiable
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted text-right">Posted {listing.postedAt}</p>
            </div>

            {/* Seller & Action Card */}
            <div className="panel-card space-y-6">
              <h3 className="text-lg font-semibold">Seller Info</h3>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary text-white font-bold text-xl rounded-full flex items-center justify-center flex-shrink-0">
                  {(listing.sellerId?.name || listing.sellerName).charAt(0)}
                </div>
                <div>
                  <Link href={`/profile/${listing.sellerId?._id || 'unknown'}`} className="font-semibold text-text-primary hover:underline hover:text-brand-primary">
                    {listing.sellerId?.name || listing.sellerName}
                  </Link>
                  <p className="text-sm text-text-secondary">
                    ⭐ {listing.sellerId?.averageRating || 0} ({listing.sellerId?.totalRatings || 0} ratings)
                  </p>
                </div>
              </div>
              
              {user && user._id !== (listing.sellerId?._id || listing.sellerId) && (
                <div className="pt-2 pl-[64px] flex items-center gap-1">
                  <span className="text-xs text-text-muted mr-1">Rate:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => handleRateSeller(star)}
                      className="text-text-muted hover:text-yellow-400 transition-colors"
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-1 border-t border-border-subtle pt-4">
                <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Meet Address</p>
                <p className="text-sm text-text-primary font-medium">{listing.meetAddress}</p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                {listing.sellerId?.phone || listing.sellerPhone ? (
                  <a 
                    href={generateWhatsAppLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                ) : (
                  <button 
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-bg-hover text-text-muted font-semibold py-3 px-4 rounded-xl cursor-not-allowed border border-border-subtle"
                  >
                    No WhatsApp Provided
                  </button>
                )}
                
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-bg-base hover:bg-bg-hover text-text-primary font-semibold py-3 px-4 rounded-xl transition-colors border border-border-subtle shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Listing
                </button>
                
                {user && user._id !== (listing.sellerId?._id || listing.sellerId) && (
                  <button 
                    onClick={handleToggleSave}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-colors border shadow-sm ${
                      isSaved 
                        ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50' 
                        : 'bg-bg-base hover:bg-bg-hover text-text-primary border-border-subtle'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isSaved ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isSaved ? 'Saved to Wishlist' : 'Save for Later'}
                  </button>
                )}
              </div>
            </div>

            {/* Subtle Report Button */}
            <div className="flex justify-center pt-2">
              <button 
                onClick={handleReportListing}
                className="text-xs text-text-muted hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report this listing
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
