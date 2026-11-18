// Small display helpers shared across pages.

/** ₹1,23,456 — or "FREE" for zero-priced items. */
export const formatPrice = (price: number) =>
  price <= 0 ? 'FREE' : `₹${price.toLocaleString('en-IN')}`;

/** Percentage off the original price, or null if there's no real discount. */
export const discountPercent = (price: number, originalPrice?: number | null) => {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

/** "just now", "5m ago", "3h ago", "2d ago", or a short date for older items. */
export const timeAgo = (iso: string | Date) => {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Whole days from now until a date (negative if it's in the past). */
export const daysUntil = (iso: string | Date) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/**
 * Label for a seller's "leaving campus" countdown, or null if the date
 * is missing, already passed, or more than 60 days away.
 */
export const leavingLabel = (iso?: string | Date | null) => {
  if (!iso) return null;
  const days = daysUntil(iso);
  if (days < 0 || days > 60) return null;
  if (days === 0) return 'Leaving today';
  if (days === 1) return 'Leaving tomorrow';
  return `Leaving in ${days} days`;
};

/** wa.me link for an Indian mobile number with a pre-filled message. */
export const whatsAppLink = (phone: string, text: string) => {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};
