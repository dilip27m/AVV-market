import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// User Document Interface
// ============================================================
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  googleId: string;
  profileImage: string;
  phone: string;
  meetAddress: string;
  averageRating: number;
  totalRatings: number;
  totalItemsSold: number;
  wishlist: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// User Schema
// ============================================================
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      required: [true, 'Google ID is required'],
      unique: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    meetAddress: {
      type: String,
      default: '',
      trim: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalItemsSold: {
      type: Number,
      default: 0,
    },
    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
      default: [],
    },
  },
  {
    timestamps: true, // auto createdAt + updatedAt
  }
);

// Indexes for common queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
