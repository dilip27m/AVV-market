import { Request, Response } from 'express';
import { Comment } from '../models/Comment';
import { Listing } from '../models/Listing';
import { isObjectId } from '../utils/validate';

// ============================================================
// GET /api/comments/:listingId
//
// Get all comments for a specific listing, sorted oldest to newest.
// ============================================================
export const getCommentsForListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId } = req.params;
    if (!isObjectId(listingId)) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const comments = await Comment.find({ listingId })
      .sort({ createdAt: 1 }) // oldest first makes it read like a conversation
      .limit(200)
      .lean();

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// ============================================================
// POST /api/comments/:listingId
//
// Add a new comment to a listing.
// ============================================================
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId } = req.params;
    const { text } = req.body;
    const user = req.user!;

    if (typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Comment text is required' });
      return;
    }
    if (text.length > 1000) {
      res.status(400).json({ success: false, message: 'Comment cannot exceed 1000 characters' });
      return;
    }

    if (!isObjectId(listingId) || !(await Listing.exists({ _id: listingId, status: { $ne: 'DELETED' } }))) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const comment = await Comment.create({
      listingId,
      userId: user._id,
      userName: user.name,
      userProfileImage: user.profileImage || '',
      text: text.trim(),
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// ============================================================
// DELETE /api/comments/:id
//
// Delete a comment (only owner of the comment can delete it).
// ============================================================
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Only the user who made the comment can delete it
    // The comment author OR the seller of the listing can delete it
    const isAuthor = comment.userId.toString() === req.userId;
    const isListingOwner = !!(await Listing.exists({ _id: comment.listingId, sellerId: req.userId }));

    if (!isAuthor && !isListingOwner) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      return;
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
