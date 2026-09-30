'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function SellPage() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;
      
      if (totalImages > 4) {
        alert('You can only upload a maximum of 4 images.');
        return;
      }
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      
      setImages(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sell an Item</h1>
        <p className="text-text-secondary mb-8">
          Fill out the details below to list your item on the campus marketplace.
        </p>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          
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
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Description</label>
              <textarea 
                placeholder="Describe the condition, reason for selling, or any other details..." 
                className="w-full min-h-[120px] resize-y"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Category</label>
                <select className="w-full" required>
                  <option value="" disabled selected>Select category...</option>
                  <option>Books</option>
                  <option>Clothes</option>
                  <option>Electronics</option>
                  <option>Furniture</option>
                  <option>Fitness</option>
                  <option>Accessories</option>
                  <option>Bags</option>
                  <option>Hostel Essentials</option>
                  <option>Cycles</option>
                  <option>Others</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Condition</label>
                <select className="w-full" required>
                  <option>New</option>
                  <option>Like New</option>
                  <option selected>Used - Good</option>
                  <option>Used - Fair</option>
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
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-8">
                <input 
                  type="checkbox" 
                  id="negotiable"
                  className="w-5 h-5 rounded border-border-subtle text-brand-primary focus:ring-brand-primary bg-bg-base"
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
                <input 
                  type="tel" 
                  placeholder="e.g., +91 9876543210" 
                  className="w-full"
                  required
                />
                <p className="text-xs text-text-muted">Buyers will use this to contact you.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Meet Address</label>
                <input 
                  type="text" 
                  placeholder="e.g., Main Library Entrance, Block A" 
                  className="w-full"
                  required
                />
                <p className="text-xs text-text-muted">Where should the buyer meet you?</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 pb-12">
            <Link href="/" className="btn-secondary px-6">
              Cancel
            </Link>
            <button type="submit" className="btn-primary px-8">
              Post Listing
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
