import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// Report Reason Enum
// ============================================================
export const REPORT_REASONS = [
  'Wrong Information',
  'Spam',
  'Inappropriate Item',
  'Already Sold',
  'Suspected Stolen Item',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUS = ['PENDING', 'REVIEWED', 'DISMISSED'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];

// ============================================================
// Report Document Interface
// ============================================================
export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: Date;
}

// ============================================================
// Report Schema
// ============================================================
const reportSchema = new Schema<IReport>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: {
        values: REPORT_REASONS,
        message: '{VALUE} is not a valid report reason',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      default: 'PENDING',
      enum: {
        values: REPORT_STATUS,
        message: '{VALUE} is not a valid status',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from the same user on the same listing
reportSchema.index({ listingId: 1, reporterId: 1 }, { unique: true });

export const Report = mongoose.model<IReport>('Report', reportSchema);
