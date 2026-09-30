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
// Only allows updating: name, phone, hostel.
// ============================================================
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, hostel } = req.body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (hostel !== undefined) updateData.hostel = hostel;

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
