'use client';

import { useEffect, useRef, useState } from 'react';
import { whatsAppLink } from '@/lib/format';

interface OfferDialogProps {
  open: boolean;
  onClose: () => void;
  phone: string;
  sellerName: string;
  title: string;
  price: number;
}

/** Lets a buyer pick an offer price, then opens WhatsApp with the message filled in. */
export function OfferDialog({ open, onClose, phone, sellerName, title, price }: OfferDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const suggestions = [0.9, 0.8, 0.7].map((f) => Math.max(1, Math.round((price * f) / 10) * 10));
  const [offer, setOffer] = useState(String(suggestions[0]));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const amount = Number(offer);
  const valid = Number.isFinite(amount) && amount > 0;
  const message = `Hi ${sellerName}! I saw your "${title}" on CampusMart (listed at ₹${price}). Would you take ₹${amount} for it?`;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold">Make an offer</h2>
          <p className="text-sm text-text-muted">Listed at ₹{price.toLocaleString('en-IN')}. Be fair — they&apos;re a student too!</p>
        </div>

        <div className="flex gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOffer(String(s))}
              className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                offer === String(s) ? 'border-brand-primary bg-brand-soft text-brand-primary' : 'border-border-subtle hover:bg-bg-hover'
              }`}
            >
              ₹{s.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            className="w-full !pl-8 text-lg font-semibold"
            aria-label="Your offer in rupees"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">
            Cancel
          </button>
          <a
            href={valid ? whatsAppLink(phone, message) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => valid && onClose()}
            aria-disabled={!valid}
            className={`flex-1 inline-flex items-center justify-center rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebd5a] ${
              valid ? '' : 'opacity-50 pointer-events-none'
            }`}
          >
            Send on WhatsApp
          </a>
        </div>
      </div>
    </dialog>
  );
}
