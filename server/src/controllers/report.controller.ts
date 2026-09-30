import { Request, Response } from 'express';
import { Report } from '../models/Report';

// ============================================================
// POST /api/reports
//
// Report a listing. One report per user per listing.
// ============================================================
export const reportListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId, reason, description } = req.body;
    const reporterId = req.userId!;

    if (!listingId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Listing ID and reason are required',
      });
      return;
    }

    const report = await Report.create({
      listingId,
      reporterId,
      reason,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted. Thank you for helping keep the marketplace safe.',
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'You have already reported this listing',
      });
      return;
    }

    console.error('Report listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
    });
  }
};
