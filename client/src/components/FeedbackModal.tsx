'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type FeedbackType = 'BUG' | 'SUGGESTION' | 'FUNCTIONALITY' | 'OTHER';

const FEEDBACK_OPTIONS: { label: string; value: FeedbackType; icon: string }[] = [
  { label: 'Bug / Broken', value: 'BUG', icon: '🐛' },
  { label: 'Feature Idea', value: 'SUGGESTION', icon: '💡' },
  { label: 'Functionality', value: 'FUNCTIONALITY', icon: '⚡' },
  { label: 'General', value: 'OTHER', icon: '💬' },
];

export function FeedbackButton({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('BUG');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || subject.trim().length < 3) {
      toast.error('Please enter a brief subject (at least 3 characters)');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error('Please describe the issue or idea (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/feedback', {
        type,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      });

      toast.success('Thank you! Your feedback has been sent to the developer.');
      setSubject('');
      setMessage('');
      setIsOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send feedback. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer ${className}`}
      >
        <span>🛠️ Report bug / Feedback</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[2rem] bg-bg-panel border border-border-subtle p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-bg-hover text-text-muted hover:text-text-primary flex items-center justify-center transition-colors text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-text-primary">
                Feedback & Bug Report 🛠️
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Found something broken or have a suggestions for the website? Let the developer know so we can fix it!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-primary">Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        type === opt.value
                          ? 'border-brand-primary bg-brand-soft text-brand-primary font-bold shadow-xs'
                          : 'border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-subject" className="text-xs font-semibold text-text-primary">
                  Subject *
                </label>
                <input
                  id="feedback-subject"
                  type="text"
                  placeholder="e.g. Buttons not working on mobile, Filter issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={150}
                  required
                  className="w-full text-sm"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-message" className="text-xs font-semibold text-text-primary">
                  Details *
                </label>
                <textarea
                  id="feedback-message"
                  placeholder="Please describe what happened, what went wrong, or what you'd like improved..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={3000}
                  required
                  rows={4}
                  className="w-full text-sm resize-y min-h-[100px]"
                />
                <p className="text-[11px] text-text-muted text-right">{message.length}/3000</p>
              </div>

              {/* Contact Email (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-email" className="text-xs font-semibold text-text-primary">
                  Your Email <span className="font-normal text-text-muted">(Optional, for updates)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 text-sm py-2.5"
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
