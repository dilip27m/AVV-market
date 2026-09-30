'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export default function ReportMissingItem() {
  const router = useRouter();

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;
      
      if (totalImages > 3) {
        toast.error('You can only upload a maximum of 3 images for a missing item.');
        return;
      }
      
      const options = {
        maxSizeMB: 0.3,
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
      formData.append('title', itemName);
      formData.append('description', description);
      formData.append('lastSeenLocation', lastSeenLocation);

      images.forEach(image => {
        formData.append('images', image);
      });

      await api.post('/missing-items', formData);

      router.push('/lost-and-found');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to report item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-6 sm:p-12 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/lost-and-found" className="text-sm text-text-muted hover:text-text-primary mb-4 inline-block">
            &larr; Back to Lost & Found
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-red-600 dark:text-red-400">Report Missing Item</h1>
          <p className="text-text-secondary">
            Provide details about the item you lost so the campus community can keep an eye out for it.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="panel-card space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Item Details</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Item Name / Model</label>
              <input 
                type="text" 
                placeholder="e.g., Black Casio G-Shock Watch" 
                className="w-full focus:ring-red-500/50"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Last Seen Location & Time (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., Main Library 2nd Floor, yesterday around 4 PM" 
                className="w-full focus:ring-red-500/50"
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Identifying Marks / Description (Optional)</label>
              <textarea 
                placeholder="Describe any scratches, stickers, or unique features..." 
                className="w-full min-h-[100px] resize-y focus:ring-red-500/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="panel-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Photos (Optional)</h2>
              <p className="text-sm text-text-muted">Upload up to 3 photos of the item if you have them.</p>
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
              
              {images.length < 3 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary focus-within:ring-2 focus-within:ring-red-500/50">
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

          <div className="flex justify-end gap-4 pt-4 pb-12">
            <Link href="/lost-and-found" className="btn-secondary px-6 flex items-center justify-center">
              Cancel
            </Link>
            <button 
              type="submit" 
              className={`px-8 py-2 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Report as Missing'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
