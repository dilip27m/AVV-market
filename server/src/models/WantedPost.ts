import mongoose, { Schema, Document } from 'mongoose';
import { LISTING_CATEGORIES } from './Listing';

// ============================================================
// Wanted Post
//
// "Looking for..." requests — e.g. a fresher asking for a drafter
// or a cycle. Sellers who have the item contact the requester.
// ============================================================
export const WANTED_STATUS = ['OPEN', 'FULFILLED', 'CLOSED'] as const;
export type WantedStatus = (typeof WANTED_STATUS)[number];

export interface IWantedPost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  status: WantedStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const wantedPostSchema = new Schema<IWantedPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    category: { type: String, enum: LISTING_CATEGORIES, default: 'Others' },
    budget: { type: Number, min: 0 },
    status: { type: String, enum: WANTED_STATUS, default: 'OPEN' },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

wantedPostSchema.index({ status: 1, createdAt: -1 });

export const WantedPost = mongoose.model<IWantedPost>('WantedPost', wantedPostSchema);
