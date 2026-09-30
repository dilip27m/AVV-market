import { Request, Response } from 'express';
import { Rating } from '../models/Rating';
import { User } from '../models/User';

// ============================================================
// POST /api/ratings
//
// Rate a seller. One rating per buyer per seller (upsert).
// Recalculates the seller's average rating after each submission.
// ============================================================
export const rateSeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId, rating } = req.body;
    const raterId = req.userId!;

    // Can't rate yourself
    if (sellerId === raterId) {
      res.status(400).json({
        success: false,
        message: 'You cannot rate yourself',
      });
      return;
    }

    // Validate rating value
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
      return;
    }

    // Check if seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
      return;
    }

    // Upsert: create or update the rating
    await Rating.findOneAndUpdate(
      { sellerId, raterId },
      { sellerId, raterId, rating: ratingNum },
      { upsert: true, new: true }
    );

    // Recalculate seller's average rating
    const ratingStats = await Rating.aggregate([
      { $match: { sellerId: seller._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (ratingStats.length > 0) {
      seller.averageRating = Math.round(ratingStats[0].averageRating * 10) / 10;
      seller.totalRatings = ratingStats[0].totalRatings;
      await seller.save();
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        averageRating: seller.averageRating,
        totalRatings: seller.totalRatings,
      },
    });
  } catch (error: any) {
    console.error('Rate seller error:', error);

    // Duplicate key error (shouldn't happen with upsert, but just in case)
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'You have already rated this seller',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
    });
  }
};

// ============================================================
// GET /api/ratings/:sellerId
//
// Get all ratings for a seller.
// ============================================================
export const getSellerRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await Rating.find({ sellerId: req.params.sellerId })
      .populate('raterId', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
    });
  }
};
