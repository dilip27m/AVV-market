// These lists must match the enums on the Express backend.

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
  'Room Bundles',
  'Others',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<ListingCategory, string> = {
  Books: '📚',
  Clothes: '👕',
  Electronics: '🎧',
  Furniture: '🪑',
  Fitness: '🏋️',
  Accessories: '⌚',
  Bags: '🎒',
  'Hostel Essentials': '🛏️',
  Cycles: '🚲',
  'Room Bundles': '📦',
  Others: '✨',
};

export const ITEM_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair'] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'oldest', label: 'Oldest first' },
] as const;

export const REPORT_REASONS = [
  'Wrong Information',
  'Spam',
  'Inappropriate Item',
  'Already Sold',
  'Suspected Stolen Item',
  'Other',
] as const;

/**
 * Suggested meet-up spots shown as you type. Edit this list to match
 * your campus — people can still type anything.
 */
export const CAMPUS_SPOTS = [
  'Main Gate',
  'Library Entrance',
  'Academic Block',
  'Main Canteen',
  'Boys Hostel Gate',
  'Girls Hostel Gate',
  'Sports Complex',
  'Admin Block',
  'Parking Area',
] as const;
