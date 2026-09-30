import { Request, Response } from 'express';
import { Listing } from '../models/Listing';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import NodeCache from 'node-cache';

// Cache for 60 seconds
const cache = new NodeCache({ stdTTL: 60 });

// ============================================================
// Helper: Upload buffer to Cloudinary
// ============================================================
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // max 800x800, maintain ratio
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ============================================================
// POST /api/listings
//
// Create a new listing with image uploads.
// Images are uploaded to Cloudinary, URLs stored in MongoDB.
// ============================================================
export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, category, price, isNegotiable, condition, meetAddress } = req.body;

    // Upload images to Cloudinary concurrently
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, 'avv-market/listings')
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map(result => result.secure_url);
    }

    const listing = await Listing.create({
      sellerId: user._id,
      title,
      description: description || '',
      images: imageUrls,
      category,
      price: Number(price),
      isNegotiable: isNegotiable === 'true' || isNegotiable === true,
      condition: condition || 'Used - Good',
      sellerName: user.name,
      sellerPhone: user.phone || '',
      meetAddress: meetAddress || user.meetAddress || '',
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      data: listing,
      message: 'Listing created successfully',
    });

    // Invalidate feed cache so the new item shows up instantly
    cache.flushAll();
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create listing',
    });
  }
};

// ============================================================
// GET /api/listings
//
// Browse listings with pagination, filtering, and sorting.
// Query params: page, limit, category, sort, search
// ============================================================
export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      sort = 'newest',
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: Record<string, unknown> = {
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    };

    if (category && category !== 'All') {
      filter.category = category;
    }

    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Build sort
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; // newest first
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Generate unique cache key based on query params
    const cacheKey = `listings_${page}_${limit}_${category || 'all'}_${sort}_${search || ''}`;
    
    // Check if we have a cached response
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      res.status(200).json(cachedResponse);
      return;
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter),
    ]);

    const responseData = {
      success: true,
      data: {
        listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore: skip + limitNum < total,
        },
      },
    };

    // Save to cache before returning
    cache.set(cacheKey, responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
    });
  }
};

// ============================================================
// GET /api/listings/:id
//
// Get a single listing by ID with seller info.
// ============================================================
export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'name email profileImage averageRating totalRatings meetAddress phone')
      .lean();

    if (!listing) {
      res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
    });
  }
};

// ============================================================
// PUT /api/listings/:id
//
// Edit a listing. Only the owner can edit.
// Supports adding new images and removing existing ones.
// ============================================================
export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    // Authorization: only the seller can edit
    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
      return;
    }

    const { title, description, category, price, isNegotiable, condition, meetAddress, existingImages } = req.body;

    // Parse existing images that the user wants to keep
    let keptImages: string[] = [];
    if (existingImages) {
      keptImages = typeof existingImages === 'string'
        ? JSON.parse(existingImages)
        : existingImages;
    }

    // Upload new images concurrently
    let newImageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, 'avv-market/listings')
      );
      const results = await Promise.all(uploadPromises);
      newImageUrls = results.map(result => result.secure_url);
    }

    const allImages = [...keptImages, ...newImageUrls].slice(0, 4);

    // Update fields
    listing.title = title || listing.title;
    listing.description = description !== undefined ? description : listing.description;
    listing.images = allImages;
    listing.category = category || listing.category;
    listing.price = price !== undefined ? Number(price) : listing.price;
    listing.isNegotiable = isNegotiable !== undefined
      ? (isNegotiable === 'true' || isNegotiable === true)
      : listing.isNegotiable;
    listing.condition = condition || listing.condition;
    listing.meetAddress = meetAddress || listing.meetAddress;

    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Listing updated successfully',
    });

    // Invalidate feed cache
    cache.flushAll();
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to update listing' });
  }
};

// ============================================================
// PATCH /api/listings/:id/status
//
// Toggle listing status (ACTIVE ↔ SOLD). Owner only.
// When marked as SOLD, increments seller's totalItemsSold.
// ============================================================
export const updateListingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'SOLD'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE or SOLD',
      });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const previousStatus = listing.status;
    listing.status = status;
    await listing.save();

    // Update seller's sold count when marking as sold
    if (status === 'SOLD' && previousStatus === 'ACTIVE') {
      const { User } = await import('../models/User');
      await User.findByIdAndUpdate(listing.sellerId, {
        $inc: { totalItemsSold: 1 },
      });
    }

    // Decrement if re-activating a sold item
    if (status === 'ACTIVE' && previousStatus === 'SOLD') {
      const { User } = await import('../models/User');
      await User.findByIdAndUpdate(listing.sellerId, {
        $inc: { totalItemsSold: -1 },
      });
    }

    res.status(200).json({
      success: true,
      data: listing,
      message: `Listing marked as ${status.toLowerCase()}`,
    });

    // Invalidate feed cache
    cache.flushAll();
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ============================================================
// DELETE /api/listings/:id
//
// Soft-delete a listing (set status to DELETED). Owner only.
// ============================================================
export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    listing.status = 'DELETED';
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully',
    });

    // Invalidate feed cache
    cache.flushAll();
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
};

// ============================================================
// GET /api/listings/my
//
// Get the current user's listings (all statuses except DELETED).
// ============================================================
export const getMyListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await Listing.find({
      sellerId: req.userId,
      status: { $ne: 'DELETED' },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: listings,
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// ============================================================
// PATCH /api/listings/:id/renew
//
// Renew a listing for another 30 days.
// ============================================================
export const renewListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Extend expiresAt by 30 days from now
    listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    // If it was somehow EXPIRED (or we want to ensure it's active)
    listing.status = 'ACTIVE';
    
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing renewed for 30 days',
      data: listing
    });

    // Invalidate feed cache
    cache.flushAll();
  } catch (error) {
    console.error('Renew listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to renew listing' });
  }
};
// ============================================================
// DELETE /api/listings/:id/admin
//
// Admin delete a listing without checking sellerId
// ============================================================
export const adminDeleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    // Force delete or mark as deleted
    listing.status = 'DELETED';
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing forcefully deleted by admin',
    });

    // Invalidate feed cache
    cache.flushAll();
  } catch (error) {
    console.error('Admin delete listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
};
