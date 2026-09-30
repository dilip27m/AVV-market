import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// Missing Item Status
// ============================================================
export const MISSING_STATUS = ['MISSING', 'FOUND', 'CLOSED'] as const;
export type MissingStatus = (typeof MISSING_STATUS)[number];

// ============================================================
// Missing Item Document Interface
// ============================================================
export interface IMissingItem extends Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  category: string;
  lastSeenLocation: string;
  lastSeenDate: Date;
  contactPhone: string;
  reporterName: string;
  status: MissingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Missing Item Schema
// 
// Purpose: Students can report lost/stolen items. Buyers browsing
// the marketplace can cross-check listings against missing items
// to help identify potentially stolen goods.
// ============================================================
const missingItemSchema = new Schema<IMissingItem>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Item name is required'],
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
        validator: (val: string[]) => val.length <= 3,
        message: 'Maximum 3 images allowed for missing items',
      },
      default: [],
    },
    category: {
      type: String,
      default: 'Others',
      trim: true,
    },
    lastSeenLocation: {
      type: String,
      required: [true, 'Last seen location is required'],
      trim: true,
    },
    lastSeenDate: {
      type: Date,
      default: Date.now,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },
    reporterName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'MISSING',
      enum: {
        values: MISSING_STATUS,
        message: '{VALUE} is not a valid status',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Browse missing items: active ones sorted by most recent
missingItemSchema.index({ status: 1, createdAt: -1 });

// Text search on title and description
missingItemSchema.index({ title: 'text', description: 'text' });

export const MissingItem = mongoose.model<IMissingItem>('MissingItem', missingItemSchema);
