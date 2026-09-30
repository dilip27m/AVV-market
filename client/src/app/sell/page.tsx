'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LISTING_CATEGORIES } from '@/lib/constants';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export default function SellPage() {
  const router = useRouter();
  
  // Form State
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Used - Good');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [sellerPhone, setSellerPhone] = useState('');
  const [meetAddress, setMeetAddress] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;
      
      if (totalImages > 4) {
        toast.error('You can only upload a maximum of 4 images.');
        return;
      }
      
      const options = {
        maxSizeMB: 0.3, // ~300KB
        maxWidthOrHeight: 1280,
        useWebWorker: true
      };

      try {
        const compressedFiles = await Promise.all(
          newFiles.map(file => imageCompression(file, options))
        );
        
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setImages(prev => [...prev, ...compressedFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
      } catch (error) {
        toast.error('Failed to compress image.');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('price', price);
      formData.append('isNegotiable', String(isNegotiable));
      if (sellerPhone) formData.append('sellerPhone', sellerPhone);
      if (meetAddress) formData.append('meetAddress', meetAddress);

      // Append images
      images.forEach(image => {
        formData.append('images', image);
      });

      const { data } = await api.post('/listings', formData);

      // Redirect to the newly created listing
      router.push(`/listing/${data.data._id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sell an Item</h1>
        <p className="text-text-secondary mb-8">
          Fill out the details below to list your item on the campus marketplace.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Images Section */}
          <div className="panel-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Photos</h2>
              <p className="text-sm text-text-muted">Upload up to 4 photos of the item. Clear photos sell faster.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border-subtle bg-bg-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {images.length < 4 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-xs">Add Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="panel-card space-y-5">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Item Details</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Title</label>
              <input 
                type="text" 
                placeholder="e.g., MacBook Stand, Engineering Drawing Kit" 
                className="w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Description</label>
              <textarea 
                placeholder="Describe the condition, reason for selling, or any other details..." 
                className="w-full min-h-[120px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Category</label>
                <select className="w-full" value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="" disabled>Select category...</option>
                  {LISTING_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Condition</label>
                <select className="w-full" value={condition} onChange={(e) => setCondition(e.target.value)} required>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Used - Fair">Used - Fair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Price (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g., 500" 
                  className="w-full"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-8">
                <input 
                  type="checkbox" 
                  id="negotiable"
                  className="w-5 h-5 rounded border-border-subtle text-brand-primary focus:ring-brand-primary bg-bg-base"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                />
                <label htmlFor="negotiable" className="text-sm font-medium text-text-primary cursor-pointer">
                  Price is negotiable
                </label>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="panel-card space-y-5">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Contact & Meetup</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Phone / WhatsApp Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border-b border-border-subtle bg-transparent text-text-secondary text-sm border-r-0">
                    +91
                  </span>
                  <input 
                    type="tel" 
                    placeholder="9490004752" 
                    className="w-full flex-1 border-l-0 pl-2"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-text-muted">Buyers will use this to contact you.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Meet Address</label>
                <input 
                  type="text" 
                  placeholder="e.g., Main Library Entrance, Block A" 
                  className="w-full"
                  value={meetAddress}
                  onChange={(e) => setMeetAddress(e.target.value)}
                  required
                />
                <p className="text-xs text-text-muted">Where should the buyer meet you?</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 pb-12">
            <Link href="/" className="btn-secondary px-6 flex items-center justify-center">
              Cancel
            </Link>
            <button 
              type="submit" 
              className={`btn-primary px-8 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Listing'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
