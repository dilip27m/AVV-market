import { Request, Response } from 'express';
import { User } from '../models/User';
import { Listing } from '../models/Listing';

// ============================================================
// GET /api/users/:id
//
// Get a user's public profile.
// ============================================================
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select('-googleId -__v')
      .lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Count active listings
    const activeListings = await Listing.countDocuments({
      sellerId: user._id,
      status: 'ACTIVE',
    });

    res.status(200).json({
      success: true,
      data: {
        ...user,
        activeListings,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ============================================================
// PUT /api/users/me
//
// Update the current user's profile.
// Only allows updating: name, phone, meetAddress.
// ============================================================
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, meetAddress } = req.body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (meetAddress !== undefined) updateData.meetAddress = meetAddress;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-googleId -__v');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ============================================================
// GET /api/users/:id/listings
//
// Get a user's active listings (public).
// ============================================================
export const getUserListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await Listing.find({
      sellerId: req.params.id,
      status: 'ACTIVE',
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: listings,
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// ============================================================
// POST /api/users/:id/rate
//
// Rate a seller.
// ============================================================
export const rateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating } = req.body;
    const numRating = Number(rating);

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Simplistic rating: just update running average
    const currentTotal = targetUser.totalRatings || 0;
    const currentAvg = targetUser.averageRating || 0;

    const newTotal = currentTotal + 1;
    const newAvg = ((currentAvg * currentTotal) + numRating) / newTotal;

    targetUser.totalRatings = newTotal;
    targetUser.averageRating = Number(newAvg.toFixed(1)); // keep 1 decimal
    await targetUser.save();

    res.status(200).json({
      success: true,
      data: {
        averageRating: targetUser.averageRating,
        totalRatings: targetUser.totalRatings,
      },
    });
  } catch (error) {
    console.error('Rate user error:', error);
    res.status(500).json({ success: false, message: 'Failed to rate user' });
  }
};
