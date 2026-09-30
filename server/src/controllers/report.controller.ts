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

// ============================================================
// GET /api/reports
//
// Get all reports (Admin only - for simplicity, we'll just check if the user exists for now, 
// in production you would add role: 'admin' to User model)
// ============================================================
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await Report.find()
      .populate('listingId', 'title category price status images sellerName')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    });
  }
};

// ============================================================
// PATCH /api/reports/:id/status
//
// Update a report status (e.g. to DISMISSED or REVIEWED)
// ============================================================
export const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'REVIEWED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: report,
      message: 'Report status updated',
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
    });
  }
};
