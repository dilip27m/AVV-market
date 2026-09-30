import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// Category & Status Enums
// ============================================================
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

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_STATUS = ['ACTIVE', 'SOLD', 'EXPIRED', 'DELETED'] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

export const ITEM_CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair'] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

// ============================================================
// Listing Document Interface
// ============================================================
export interface IListing extends Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  category: ListingCategory;
  price: number;
  isNegotiable: boolean;
  condition: ItemCondition;
  sellerName: string;
  sellerPhone: string;
  meetAddress: string;
  status: ListingStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Listing Schema
// ============================================================
const listingSchema = new Schema<IListing>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      validate: {
        validator: (val: string[]) => val.length <= 4,
        message: 'Maximum 4 images allowed',
      },
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: LISTING_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isNegotiable: {
      type: Boolean,
      default: false,
    },
    condition: {
      type: String,
      default: 'Used - Good',
      enum: {
        values: ITEM_CONDITIONS,
        message: '{VALUE} is not a valid condition',
      },
    },
    // Denormalized seller info for performance (avoids populating on every card)
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    meetAddress: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      default: 'ACTIVE',
      enum: {
        values: LISTING_STATUS,
        message: '{VALUE} is not a valid status',
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for browsing: active listings sorted by newest
listingSchema.index({ status: 1, category: 1, createdAt: -1 });

// Text index for search
listingSchema.index({ title: 'text', description: 'text' });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
