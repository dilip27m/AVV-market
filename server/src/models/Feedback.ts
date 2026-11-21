import mongoose, { Schema, Document } from 'mongoose';

export const FEEDBACK_TYPES = ['BUG', 'SUGGESTION', 'FUNCTIONALITY', 'OTHER'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUS = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUS)[number];

export interface IFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  type: FeedbackType;
  subject: string;
  message: string;
  pageUrl?: string;
  deviceInfo?: string;
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      trim: true,
      default: '',
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    type: {
      type: String,
      enum: FEEDBACK_TYPES,
      default: 'BUG',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    pageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    deviceInfo: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: FEEDBACK_STATUS,
      default: 'NEW',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
