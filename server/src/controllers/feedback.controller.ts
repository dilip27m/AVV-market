import { Request, Response } from 'express';
import { Feedback, FEEDBACK_TYPES, FEEDBACK_STATUS } from '../models/Feedback';
import { isObjectId } from '../utils/validate';

// ============================================================
// POST /api/feedback (Public / Optional Auth)
//
// Allows users to submit bugs, feature requests, or website issues.
// ============================================================
export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, subject, message, pageUrl, deviceInfo, email, name } = req.body || {};

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Please provide a brief subject (at least 3 characters)' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Please provide more details in your message (at least 10 characters)' });
      return;
    }

    const validatedType = (FEEDBACK_TYPES as readonly string[]).includes(type) ? type : 'BUG';

    const feedback = await Feedback.create({
      userId: req.user?._id || undefined,
      userName: req.user?.name || (typeof name === 'string' ? name.trim() : '') || 'Anonymous Student',
      userEmail: req.user?.email || (typeof email === 'string' ? email.trim().toLowerCase() : ''),
      type: validatedType,
      subject: subject.trim().slice(0, 150),
      message: message.trim().slice(0, 3000),
      pageUrl: typeof pageUrl === 'string' ? pageUrl.trim().slice(0, 500) : '',
      deviceInfo: typeof deviceInfo === 'string' ? deviceInfo.trim().slice(0, 300) : '',
      status: 'NEW',
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Thank you for your feedback! The developer will review and fix it.',
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
};

// ============================================================
// GET /api/feedback (Admin only)
// ============================================================
export const getFeedbacks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find()
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
};

// ============================================================
// PATCH /api/feedback/:id/status (Admin only)
// ============================================================
export const updateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body || {};

    if (!isObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid feedback ID' });
      return;
    }

    if (!(FEEDBACK_STATUS as readonly string[]).includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback not found' });
      return;
    }

    feedback.status = status;
    if (adminNote !== undefined && typeof adminNote === 'string') {
      feedback.adminNote = adminNote.trim();
    }
    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback,
      message: `Feedback marked as ${status.toLowerCase()}`,
    });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update feedback' });
  }
};

// ============================================================
// DELETE /api/feedback/:id (Admin only)
// ============================================================
export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid feedback ID' });
      return;
    }

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete feedback' });
  }
};
