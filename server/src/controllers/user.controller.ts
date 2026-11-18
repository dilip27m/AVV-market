import { Request, Response } from 'express';
import { User } from '../models/User';
import { Listing } from '../models/Listing';
import { isObjectId, normalizePhone } from '../utils/validate';
import { invalidateListingsCache } from './listing.controller';
import { serializeUser } from './auth.controller';

// Fields that are safe to show to anyone (no email, phone, or wishlist)
const PUBLIC_PROFILE_FIELDS =
  'name profileImage meetAddress averageRating totalRatings totalItemsSold leavingDate isVerified createdAt';

// ============================================================
// GET /api/users/:id
//
// Public seller profile. Only exposes non-sensitive fields.
// ============================================================
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = await User.findById(req.params.id).select(PUBLIC_PROFILE_FIELDS).lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const activeListings = await Listing.countDocuments({
      sellerId: user._id,
      status: { $in: ['ACTIVE', 'RESERVED'] },
      expiresAt: { $gt: new Date() },
    });

    res.status(200).json({
      success: true,
      data: { ...user, activeListings },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ============================================================
// PUT /api/users/me
//
// Update own profile. Phone / name / meet address changes are
// copied onto the user's existing listings so buyers always see
// up-to-date contact details.
// ============================================================
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, meetAddress, leavingDate } = req.body;

    const updateData: Record<string, string | Date | null> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        res.status(400).json({ success: false, message: 'Name must be 1–100 characters' });
        return;
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      const normalized = normalizePhone(phone);
      if (normalized === null) {
        res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });
        return;
      }
      updateData.phone = normalized;
    }

    if (meetAddress !== undefined) {
      if (typeof meetAddress !== 'string' || meetAddress.length > 200) {
        res.status(400).json({ success: false, message: 'Meet address is too long' });
        return;
      }
      updateData.meetAddress = meetAddress.trim();
    }

    if (leavingDate !== undefined) {
      if (leavingDate === null || leavingDate === '') {
        updateData.leavingDate = null;
      } else {
        const date = new Date(leavingDate);
        const twoYears = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000;
        if (Number.isNaN(date.getTime()) || date.getTime() > twoYears) {
          res.status(400).json({ success: false, message: 'Enter a valid leaving date' });
          return;
        }
        updateData.leavingDate = date;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Keep denormalized seller info on listings in sync
    const listingUpdate: Record<string, string> = {};
    if (typeof updateData.name === 'string') listingUpdate.sellerName = updateData.name;
    if (typeof updateData.phone === 'string') listingUpdate.sellerPhone = updateData.phone;
    if (Object.keys(listingUpdate).length > 0) {
      await Listing.updateMany(
        { sellerId: req.userId, status: { $in: ['ACTIVE', 'RESERVED', 'SOLD'] } },
        { $set: listingUpdate }
      );
    }
    // Seller info (name, leaving date) appears on feed cards
    invalidateListingsCache();

    res.status(200).json({
      success: true,
      data: serializeUser(user),
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
// Public: a seller's live listings (for their storefront page).
// ============================================================
export const getUserListings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const listings = await Listing.find({
      sellerId: req.params.id,
      status: { $in: ['ACTIVE', 'RESERVED'] },
      expiresAt: { $gt: new Date() },
    })
      .select('title price originalPrice condition category meetAddress sellerName sellerId status createdAt isNegotiable images')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// ============================================================
// POST /api/users/wishlist/:listingId
// ============================================================
export const toggleWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listingId } = req.params;
    if (!isObjectId(listingId)) {
      res.status(400).json({ success: false, message: 'Invalid listing ID' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const index = user.wishlist.findIndex((id) => id.toString() === listingId);
    let added = false;

    if (index === -1) {
      const exists = await Listing.exists({ _id: listingId, status: { $ne: 'DELETED' } });
      if (!exists) {
        res.status(404).json({ success: false, message: 'Listing not found' });
        return;
      }
      user.wishlist.push(listingId as any);
      added = true;
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: { wishlist: user.wishlist, added },
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
    });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to update wishlist' });
  }
};

// ============================================================
// GET /api/users/me/wishlist
//
// Saved listings, excluding ones that were deleted.
// ============================================================
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'wishlist',
      match: { status: { $ne: 'DELETED' } },
      select: 'title price originalPrice images status expiresAt isNegotiable',
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      // populate+match leaves nulls for filtered-out items
      data: user.wishlist.filter(Boolean),
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};
