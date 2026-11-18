'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  /** Overlay label like "SOLD" */
  overlay?: string | null;
}

/**
 * Swipeable photo gallery (scroll-snap on touch, arrows on desktop)
 * with a full-screen viewer.
 */
export function ImageGallery({ images, alt, overlay }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const scrollTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  // Track which slide is visible as the user swipes
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (fullscreen && !dialog.open) dialog.showModal();
    if (!fullscreen && dialog.open) dialog.close();
  }, [fullscreen]);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-3xl border border-border-subtle bg-bg-hover flex flex-col items-center justify-center text-text-muted gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm">No photos</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative group">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex aspect-[4/3] w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-3xl border border-border-subtle bg-bg-hover"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setFullscreen(true)}
              className="relative w-full h-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`View photo ${i + 1} full screen`}
            >
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 60vw"
                className={`object-contain ${overlay ? 'grayscale-[50%] opacity-80' : ''}`}
              />
            </button>
          ))}
        </div>

        {overlay && (
          <span className="absolute top-4 left-4 badge !text-sm !px-4 !py-1.5 bg-black/85 text-white pointer-events-none">{overlay}</span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous photo"
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-bg-panel/90 backdrop-blur items-center justify-center shadow-md opacity-0 group-hover:opacity-100 disabled:!opacity-0 transition-opacity"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollTo(active + 1)}
              disabled={active === images.length - 1}
              aria-label="Next photo"
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-bg-panel/90 backdrop-blur items-center justify-center shadow-md opacity-0 group-hover:opacity-100 disabled:!opacity-0 transition-opacity"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              {images.map((src, i) => (
                <span key={src} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="hidden sm:flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-brand-primary' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      <dialog
        ref={dialogRef}
        onClose={() => setFullscreen(false)}
        className="m-0 h-full max-h-none w-full max-w-none bg-black/95 p-0 backdrop:bg-black"
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <Image src={images[active] || images[0]} alt={alt} fill sizes="100vw" className="object-contain" />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/15 text-white text-2xl flex items-center justify-center hover:bg-white/25"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => { const i = Math.max(0, active - 1); setActive(i); scrollTo(i); }} aria-label="Previous photo" className="absolute left-3 h-12 w-12 rounded-full bg-white/15 text-white text-3xl hover:bg-white/25">‹</button>
              <button type="button" onClick={() => { const i = Math.min(images.length - 1, active + 1); setActive(i); scrollTo(i); }} aria-label="Next photo" className="absolute right-3 h-12 w-12 rounded-full bg-white/15 text-white text-3xl hover:bg-white/25">›</button>
              <span className="absolute bottom-6 text-white/80 text-sm">{active + 1} / {images.length}</span>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
