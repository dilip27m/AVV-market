import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// Rating Document Interface
// ============================================================
export interface IRating extends Document {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  rating: number;
  createdAt: Date;
}

// ============================================================
// Rating Schema
// ============================================================
const ratingSchema = new Schema<IRating>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
    },
    raterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rater ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  {
    timestamps: true,
  }
);

// One rating per buyer per seller — prevents rating spam
ratingSchema.index({ sellerId: 1, raterId: 1 }, { unique: true });

// Quick lookup of all ratings for a seller
ratingSchema.index({ sellerId: 1, createdAt: -1 });

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);
