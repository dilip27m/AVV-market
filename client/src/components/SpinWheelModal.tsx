'use client';

import { useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { formatPrice, whatsAppLink } from '@/lib/format';
import toast from 'react-hot-toast';

export interface SpinResult {
  wonPercent: number;
  discountedPrice: number;
  code: string;
  originalPrice?: number;
}

interface SpinWheelModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerPhone: string;
  sellerName: string;
  minPercent?: number;
  maxPercent?: number;
  existingResult?: SpinResult | null;
  onWon: (result: SpinResult) => void;
}

const SLICE_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DB2777', // Pink
  '#0284C7', // Sky
  '#7C3AED', // Violet
];

export function SpinWheelModal({
  open,
  onClose,
  listingId,
  listingTitle,
  listingPrice,
  sellerPhone,
  sellerName,
  minPercent = 10,
  maxPercent = 30,
  existingResult,
  onWon,
}: SpinWheelModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(existingResult || null);
  const [showCelebration, setShowCelebration] = useState(!!existingResult);

  // Sync result if prop changes
  useEffect(() => {
    if (existingResult) {
      setResult(existingResult);
      setShowCelebration(true);
    }
  }, [existingResult]);

  // Sync HTML5 dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Slices preview list (evenly spaced between min and max)
  const previewSlices = (() => {
    const count = 6;
    const list: number[] = [];
    const min = Math.max(5, minPercent);
    const max = Math.max(min, maxPercent);
    if (min === max) {
      for (let i = 0; i < count; i++) list.push(min);
    } else {
      for (let i = 0; i < count; i++) {
        list.push(Math.round(min + ((max - min) * i) / (count - 1)));
      }
    }
    return list;
  })();

  // Draw the wheel onto the canvas
  const drawWheel = (slices: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const numSlices = slices.length;
    const arc = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    slices.forEach((percent, idx) => {
      const angle = idx * arc;
      ctx.beginPath();
      ctx.fillStyle = SLICE_COLORS[idx % SLICE_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text label inside slice
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${percent}% OFF`, radius - 18, 5);
      ctx.restore();
    });

    // Outer wheel border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#E5E7EB';
    ctx.stroke();

    // Center star / text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', centerX, centerY);
  };

  useEffect(() => {
    if (open) {
      // Short delay to ensure canvas is attached and dimensioned
      const timer = setTimeout(() => drawWheel(previewSlices), 60);
      return () => clearTimeout(timer);
    }
  }, [open, minPercent, maxPercent]);

  // Handle spin action
  const handleSpin = async () => {
    if (isSpinning || result) return;
    setIsSpinning(true);

    try {
      const res = await api.post(`/listings/${listingId}/spin`);
      const { wonPercent, sliceIndex, slices, discountedPrice, code } = res.data.data;

      // Re-draw wheel with server-generated slices if different
      drawWheel(slices);

      const numSlices = slices.length;
      const sliceDeg = 360 / numSlices;
      // Needle is at top (270 deg / 12 o'clock). Center of sliceIndex needs to align with 270 deg.
      const targetDegInWheel = (sliceIndex + 0.5) * sliceDeg;
      const offsetToTop = (270 - targetDegInWheel + 360) % 360;
      // 5 full spins (1800 deg) + offset
      const finalAngle = 1800 + offsetToTop;

      setTransitionDuration(4);
      setWheelRotation(finalAngle);

      // Finish animation after 4 seconds
      setTimeout(() => {
        setIsSpinning(false);
        const wonData: SpinResult = {
          wonPercent,
          discountedPrice,
          code,
          originalPrice: listingPrice,
        };
        setResult(wonData);
        setShowCelebration(true);
        localStorage.setItem(`spin_${listingId}`, JSON.stringify(wonData));
        onWon(wonData);
        toast.success(`🎉 You won ${wonPercent}% OFF!`);
      }, 4100);
    } catch (err) {
      setIsSpinning(false);
      toast.error(getErrorMessage(err, 'Could not spin the wheel. Please try again.'));
    }
  };

  const whatsappMessage = result
    ? `Hi ${sellerName}! I spun the lucky wheel for "${listingTitle}" and won ${result.wonPercent}% OFF! Deal price: ₹${result.discountedPrice} (Verification Code: ${result.code}). Is it available?`
    : '';

  const shareChatLink = sellerPhone ? whatsAppLink(sellerPhone, whatsappMessage) : '';

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (!isSpinning && e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-md overflow-hidden"
    >
      <div className="p-6 text-center space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            <span>🎡</span>
            <span>CampusMart Lucky Wheel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-display)]">
            {showCelebration ? '🎉 Deal Unlocked!' : 'Spin for a Lucky Discount!'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted">
            {showCelebration
              ? 'Your discount is verified and saved for this item.'
              : `Win between ${minPercent}% to ${maxPercent}% OFF this item!`}
          </p>
        </div>

        {!showCelebration ? (
          /* Wheel Spinner View */
          <div className="py-2 flex flex-col items-center">
            {/* Pointer Needle pointing down at 12 o'clock */}
            <div className="relative z-10 -mb-4 flex flex-col items-center filter drop-shadow-md">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-red-600"></div>
            </div>

            {/* Canvas Wheel */}
            <div className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] mx-auto overflow-hidden rounded-full shadow-xl">
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: transitionDuration ? `transform ${transitionDuration}s cubic-bezier(0.15, 0.9, 0.2, 1)` : 'none',
                }}
              />
            </div>

            {/* Spin CTA Button */}
            <div className="mt-6 w-full max-w-xs space-y-2">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || !!result}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-primary to-indigo-600 hover:opacity-95 text-white font-bold text-base shadow-lg shadow-brand-primary/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? '🎡 Spinning...' : 'SPIN THE WHEEL NOW'}
              </button>
              <p className="text-[11px] text-text-muted">One spin per buyer per listing. No gimmicks.</p>
            </div>
          </div>
        ) : (
          /* Celebration / Won View */
          <div className="space-y-4 py-2 animate-fade-up">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-primary/10 via-emerald-500/10 to-transparent border border-brand-primary/20 space-y-3">
              <div className="text-4xl animate-bounce">🎁</div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary">Lucky Winner</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-brand-primary">
                  {result?.wonPercent}% OFF
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle flex items-center justify-around text-center">
                <div>
                  <div className="text-[11px] text-text-muted">Original Price</div>
                  <div className="text-sm font-semibold line-through text-text-muted">
                    {formatPrice(listingPrice)}
                  </div>
                </div>
                <div className="text-xl text-brand-primary font-bold">→</div>
                <div>
                  <div className="text-[11px] text-text-muted">Your Price</div>
                  <div className="text-xl font-black text-success">
                    {result ? formatPrice(result.discountedPrice) : ''}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-bg-panel border border-border-subtle flex items-center justify-between text-left">
                <span className="text-xs text-text-muted">Verification Code:</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-text-primary px-2 py-0.5 rounded bg-bg-hover">
                  {result?.code}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {sellerPhone ? (
                <a
                  href={shareChatLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-sm shadow-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                  </svg>
                  <span>Claim on WhatsApp</span>
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-2xl bg-bg-hover hover:bg-bg-panel text-text-secondary text-xs font-semibold transition-colors"
              >
                Back to Listing
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSpinning}
            className="text-xs text-text-muted hover:text-text-primary underline disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
