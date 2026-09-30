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
