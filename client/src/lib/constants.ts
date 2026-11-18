// This enum matches the LISTING_CATEGORIES on the Express backend

export const LISTING_CATEGORIES = [
  'Books',
  'Clothes',
  'Electronics',
  'Furniture',
  'Fitness',
  'Accessories',
  'Bags',
  'Hostel Essentials',
  'Cycles',
  'Others',
] as const;

export type ListingCategory = typeof LISTING_CATEGORIES[number];

export const ITEM_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair'] as const;

// Must match REPORT_REASONS on the Express backend
export const REPORT_REASONS = [
  'Wrong Information',
  'Spam',
  'Inappropriate Item',
  'Already Sold',
  'Suspected Stolen Item',
  'Other',
] as const;
