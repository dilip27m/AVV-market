// Shapes returned by the API, shared across pages.

export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'DELETED';

export interface SpinDiscountConfig {
  enabled: boolean;
  minPercent: number;
  maxPercent: number;
}

export interface SellerSummary {
  _id: string;
  name: string;
  averageRating?: number;
  leavingDate?: string | null;
  isVerified?: boolean;
}

/** A listing as shown on feed cards. */
export interface ListingSummary {
  _id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  condition: string;
  category: string;
  meetAddress: string;
  sellerName: string;
  status?: ListingStatus;
  isNegotiable?: boolean;
  spinDiscount?: SpinDiscountConfig;
  createdAt?: string;
  /** Populated seller (feed) or a bare id (some endpoints) */
  sellerId?: SellerSummary | string;
}
