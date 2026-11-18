import mongoose from 'mongoose';

/** True if the value is a valid MongoDB ObjectId string. */
export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);

/**
 * Read a query/body value as a plain string.
 * Express can parse `?a[$ne]=x` into an object — this blocks that
 * (NoSQL operator injection) by only accepting real strings.
 */
export const asString = (value: unknown, maxLength = 200): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

/**
 * Normalize an Indian mobile number to 10 digits.
 * Accepts "+91 98765 43210", "09876543210", "9876543210".
 * Returns '' for empty input and null if it's not a valid number.
 */
export const normalizePhone = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};
