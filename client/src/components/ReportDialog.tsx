'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { REPORT_REASONS } from '@/lib/constants';

interface ReportDialogProps {
  listingId: string;
  open: boolean;
  onClose: () => void;
}

export function ReportDialog({ listingId, open, onClose }: ReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Native <dialog> gives us focus trapping, Esc to close and a backdrop for free
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await api.post('/reports', { listingId, reason, description: description.trim() });
      toast.success('Thanks — our moderators will take a look.');
      setReason('');
      setDescription('');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit report.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Report this listing</h2>
          <p className="text-sm text-text-muted">What&apos;s wrong with it?</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                reason === r ? 'border-brand-primary bg-bg-hover' : 'border-border-subtle hover:bg-bg-hover'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-[var(--brand-primary)] w-4 h-4 p-0 border-0 shadow-none"
              />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="report-details" className="text-sm font-medium">
            Details <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="report-details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full min-h-[80px] text-sm"
            placeholder="Anything that helps us understand the problem"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!reason || isSubmitting}
            className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Submit report'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
