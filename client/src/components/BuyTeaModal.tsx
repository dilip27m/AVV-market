'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function BuyTeaButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
      >
        <span className="text-base" aria-hidden="true">☕</span>
        <span>Buy me a tea</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] bg-bg-panel border border-border-subtle p-6 sm:p-7 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-bg-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div className="space-y-1.5 pt-1">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl shadow-xs">
                ☕
              </div>
              <h3 className="text-xl font-extrabold text-text-primary">
                Buy me a tea
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
                CampusMart is 100% free with no ads, built by students for our campus. If you found it useful, a cup of tea helps keep the servers running!
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 rounded-2xl bg-white border border-border-subtle inline-block shadow-sm">
              <Image
                src="/upi-qr.jpg"
                alt="Scan to pay using any UPI app"
                width={220}
                height={220}
                className="rounded-xl mx-auto block"
                priority
              />
            </div>

            {/* Supported apps */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-text-muted">
                Scan with any UPI app
              </p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap text-[11px] text-text-secondary">
                <span className="px-2 py-0.5 rounded-md bg-bg-hover font-medium">GPay</span>
                <span className="px-2 py-0.5 rounded-md bg-bg-hover font-medium">PhonePe</span>
                <span className="px-2 py-0.5 rounded-md bg-bg-hover font-medium">Paytm</span>
                <span className="px-2 py-0.5 rounded-md bg-bg-hover font-medium">super.money</span>
                <span className="px-2 py-0.5 rounded-md bg-bg-hover font-medium">CRED</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted pt-1">
              Thank you for supporting student developers! ❤️
            </p>
          </div>
        </div>
      )}
    </>
  );
}
