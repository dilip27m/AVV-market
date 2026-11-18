'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { api, getErrorMessage } from '@/lib/api';
import { LISTING_CATEGORIES, ITEM_CONDITIONS, CAMPUS_SPOTS, CATEGORY_ICONS } from '@/lib/constants';
import { discountPercent } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

const MAX_IMAGES = 4;

export interface ExistingListing {
  _id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  originalPrice?: number | null;
  isNegotiable: boolean;
  meetAddress: string;
  images: string[];
}

interface ListingFormProps {
  /** When provided, the form edits this listing instead of creating a new one. */
  listing?: ExistingListing;
}

/** One photo in the form: either already uploaded (url) or picked just now (file). */
type Photo =
  | { kind: 'existing'; key: string; src: string }
  | { kind: 'new'; key: string; src: string; file: File };

export function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const isEdit = !!listing;

  // A single ordered list — the first photo is the cover shown on cards
  const [photos, setPhotos] = useState<Photo[]>(
    () => (listing?.images || []).map((src) => ({ kind: 'existing' as const, key: src, src }))
  );
  const [title, setTitle] = useState(listing?.title || '');
  const [description, setDescription] = useState(listing?.description || '');
  const [category, setCategory] = useState(listing?.category || '');
  const [condition, setCondition] = useState(listing?.condition || 'Used - Good');
  const [price, setPrice] = useState(listing ? String(listing.price) : '');
  const [originalPrice, setOriginalPrice] = useState(listing?.originalPrice ? String(listing.originalPrice) : '');
  const [isNegotiable, setIsNegotiable] = useState(listing?.isNegotiable || false);
  const [sellerPhone, setSellerPhone] = useState(user?.phone || '');
  const [meetAddress, setMeetAddress] = useState(listing?.meetAddress || user?.meetAddress || '');

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // (RequireAuth guarantees `user` is loaded before this form mounts,
  // so the profile defaults above are already filled in.)

  // Free preview object URLs when the form unmounts
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => p.kind === 'new' && URL.revokeObjectURL(p.src)), []);

  const totalImages = photos.length;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    if (files.length === 0) return;

    const room = MAX_IMAGES - totalImages;
    if (files.length > room) {
      toast.error(`You can add ${room} more photo${room === 1 ? '' : 's'} (max ${MAX_IMAGES}).`);
    }
    const accepted = files.slice(0, room);
    if (accepted.length === 0) return;

    setIsCompressing(true);
    try {
      const compressed = await Promise.all(
        accepted.map((file) =>
          imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true })
        )
      );
      setPhotos((prev) => [
        ...prev,
        ...compressed.map((file) => {
          const src = URL.createObjectURL(file);
          return { kind: 'new' as const, key: src, src, file };
        }),
      ]);
    } catch {
      toast.error('Could not process that image. Try a different photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.key === key);
      if (photo?.kind === 'new') URL.revokeObjectURL(photo.src);
      return prev.filter((p) => p.key !== key);
    });
  };

  const makeCover = (key: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.key === key);
      return photo ? [photo, ...prev.filter((p) => p.key !== key)] : prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneDigits = sellerPhone.replace(/\D/g, '').slice(-10);
    if (!isEdit && !/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError('Enter a valid 10-digit WhatsApp number so buyers can reach you.');
      return;
    }
    if (!isEdit && totalImages === 0) {
      setError('Add at least one photo — listings with photos sell much faster.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('price', price);
      formData.append('originalPrice', originalPrice);
      formData.append('isNegotiable', String(isNegotiable));
      formData.append('meetAddress', meetAddress.trim());
      if (!isEdit) formData.append('sellerPhone', phoneDigits);
      // New files are uploaded in this order; `imageOrder` tells the server how to
      // interleave them with the photos it already has ("new:0" = first new file).
      const newPhotos = photos.filter((p): p is Extract<Photo, { kind: 'new' }> => p.kind === 'new');
      newPhotos.forEach((p) => formData.append('images', p.file));
      if (isEdit) {
        formData.append('existingImages', JSON.stringify(photos.filter((p) => p.kind === 'existing').map((p) => p.src)));
        formData.append(
          'imageOrder',
          JSON.stringify(photos.map((p) => (p.kind === 'existing' ? p.src : `new:${newPhotos.indexOf(p)}`)))
        );
      }

      const { data } = isEdit
        ? await api.put(`/listings/${listing!._id}`, formData)
        : await api.post('/listings', formData);

      toast.success(isEdit ? 'Listing updated' : 'Your item is live! 🎉');
      if (!isEdit) refreshUser(); // phone/meet address may have been saved as defaults
      router.push(`/listing/${data.data._id}`);
    } catch (err) {
      setError(getErrorMessage(err, isEdit ? 'Failed to update listing.' : 'Failed to create listing.'));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Photos */}
        <div className="panel-card space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Photos</h2>
            <p className="text-sm text-text-muted">
              Up to {MAX_IMAGES} photos. Tap “Make cover” to choose the photo buyers see first.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            {photos.map((photo, idx) => (
              <div
                key={photo.key}
                className={`relative w-24 h-24 rounded-xl overflow-hidden bg-bg-base border-2 ${
                  idx === 0 ? 'border-brand-primary' : 'border-border-subtle'
                }`}
              >
                {photo.kind === 'existing' ? (
                  <Image src={photo.src} alt={`Photo ${idx + 1}`} fill sizes="96px" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  aria-label={`Remove photo ${idx + 1}`}
                  onClick={() => removePhoto(photo.key)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
                {idx === 0 ? (
                  <span className="absolute bottom-0 inset-x-0 bg-brand-primary text-[10px] font-bold text-center py-0.5" style={{ color: 'var(--text-on-brand)' }}>
                    COVER
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(photo.key)}
                    className="absolute bottom-0 inset-x-0 bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold py-0.5"
                  >
                    Make cover
                  </button>
                )}
              </div>
            ))}

            {totalImages < MAX_IMAGES && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary focus-within:ring-2 focus-within:ring-brand-primary">
                {isCompressing ? (
                  <div className="w-5 h-5 rounded-full border-2 border-text-muted border-t-text-primary animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-xs">Add Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={isCompressing}
                />
              </label>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="panel-card space-y-5">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Item Details</h2>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-text-primary">Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Engineering Drawing Kit, Study Table"
              className="w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={150}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-text-primary">
              Description <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              placeholder="Condition, how long you used it, why you're selling..."
              className="w-full min-h-[120px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-text-muted text-right">{description.length}/1000</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-text-primary">Category</label>
              <select id="category" className="w-full" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>Select category...</option>
                {LISTING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="condition" className="text-sm font-medium text-text-primary">Condition</label>
              <select id="condition" className="w-full" value={condition} onChange={(e) => setCondition(e.target.value)} required>
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="price" className="text-sm font-medium text-text-primary">Your price (₹)</label>
                <button type="button" onClick={() => setPrice('0')} className="text-xs text-success font-semibold hover:underline">
                  🎁 Give it away free
                </button>
              </div>
              <input
                id="price"
                type="number"
                inputMode="numeric"
                min="0"
                max="1000000"
                step="1"
                placeholder="e.g., 500"
                className="w-full"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="originalPrice" className="text-sm font-medium text-text-primary">
                Price when new (₹) <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                id="originalPrice"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="e.g., 1200"
                className="w-full"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
              <p className="text-xs text-text-muted">
                {(() => {
                  const pct = discountPercent(Number(price), Number(originalPrice));
                  return pct ? `Buyers will see “${pct}% off” — great for selling fast.` : 'Shows buyers how much they save.';
                })()}
              </p>
            </div>

            <div className="flex items-center space-x-3 sm:col-span-2">
              <input
                type="checkbox"
                id="negotiable"
                className="w-5 h-5 rounded border-border-subtle accent-[var(--brand-primary)]"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
              />
              <label htmlFor="negotiable" className="text-sm font-medium text-text-primary cursor-pointer">
                Price is negotiable
              </label>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="panel-card space-y-5">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Contact & Meetup</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {!isEdit ? (
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-text-primary">WhatsApp Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98XXXXXXXX"
                    className="w-full flex-1"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value.replace(/[^\d\s+]/g, ''))}
                    maxLength={14}
                    required
                  />
                </div>
                <p className="text-xs text-text-muted">Buyers tap “Chat on WhatsApp” to reach you. Saved to your profile.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">WhatsApp Number</p>
                <p className="text-sm text-text-secondary">
                  {user?.phone ? `+91 ${user.phone}` : 'Not set'} ·{' '}
                  <Link href="/profile/edit" className="underline hover:text-text-primary">Change in profile</Link>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="meet" className="text-sm font-medium text-text-primary">Meet-up Spot</label>
              <input
                id="meet"
                type="text"
                placeholder="e.g., Main Library entrance, Block A"
                className="w-full"
                value={meetAddress}
                onChange={(e) => setMeetAddress(e.target.value)}
                maxLength={200}
                list="campus-spots"
                required
              />
              <datalist id="campus-spots">
                {CAMPUS_SPOTS.map((spot) => (
                  <option key={spot} value={spot} />
                ))}
              </datalist>
              <p className="text-xs text-text-muted">Pick a public spot on campus.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 pb-12">
          <button type="button" onClick={() => router.back()} className="btn-secondary px-6" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting || isCompressing}
          >
            {isSubmitting ? (isEdit ? 'Saving...' : 'Posting...') : isEdit ? 'Save Changes' : 'Post Listing'}
          </button>
        </div>
      </form>
    </>
  );
}
