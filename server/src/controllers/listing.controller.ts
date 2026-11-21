import { Request, Response } from 'express';
import { Listing, LISTING_CATEGORIES, ITEM_CONDITIONS, VISIBLE_STATUSES } from '../models/Listing';
import { User } from '../models/User';
import { Report } from '../models/Report';
import NodeCache from 'node-cache';
import { uploadImages, deleteImages } from '../utils/images';
import { isAdminUser } from '../middleware/auth.middleware';
import { asString, isObjectId, normalizePhone } from '../utils/validate';

// Cache for 60 seconds
const cache = new NodeCache({ stdTTL: 60 });

/** Clear the browse-feed cache (call after any listing mutation). */
export const invalidateListingsCache = (): void => {
  cache.flushAll();
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Put a listing's photos in the order the seller chose (first = cover).
 * `imageOrder` is a JSON array mixing kept URLs and "new:<index>" tokens
 * for this request's uploads. Anything unknown is ignored, and any photo
 * the order forgot is appended, so a bad order can never lose a photo.
 */
const orderImages = (imageOrder: unknown, kept: string[], uploaded: string[]): string[] => {
  const fallback = [...kept, ...uploaded];
  if (typeof imageOrder !== 'string') return fallback;

  let tokens: unknown;
  try {
    tokens = JSON.parse(imageOrder);
  } catch {
    return fallback;
  }
  if (!Array.isArray(tokens)) return fallback;

  const ordered: string[] = [];
  for (const token of tokens) {
    if (typeof token !== 'string') continue;
    const match = token.match(/^new:(\d+)$/);
    const url = match ? uploaded[Number(match[1])] : kept.includes(token) ? token : undefined;
    if (url && !ordered.includes(url)) ordered.push(url);
  }
  return [...ordered, ...fallback.filter((url) => !ordered.includes(url))];
};
const SORT_OPTIONS = ['newest', 'oldest', 'price_low', 'price_high'] as const;

// ============================================================
// Helper: Validate listing fields from a multipart body.
// `partial` = true for edits (fields may be omitted).
// Returns either the cleaned fields or an error message.
// ============================================================
type ListingFields = {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number | null;
  isNegotiable?: boolean;
  condition?: string;
  meetAddress?: string;
};

const validateListingBody = (
  body: Record<string, unknown>,
  partial: boolean
): { fields: ListingFields } | { error: string } => {
  const fields: ListingFields = {};

  if (body.title !== undefined || !partial) {
    const title = asString(body.title, 1000);
    if (!title || title.length < 3) return { error: 'Title must be at least 3 characters' };
    if (title.length > 150) return { error: 'Title cannot exceed 150 characters' };
    fields.title = title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return { error: 'Invalid description' };
    if (body.description.length > 1000) return { error: 'Description cannot exceed 1000 characters' };
    fields.description = body.description.trim();
  }

  if (body.category !== undefined || !partial) {
    const category = asString(body.category);
    if (!category || !(LISTING_CATEGORIES as readonly string[]).includes(category)) {
      return { error: 'Please choose a valid category' };
    }
    fields.category = category;
  }

  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
      return { error: 'Enter a valid price' };
    }
    fields.price = Math.round(price);
  }

  // Optional "price when new". Empty string clears it.
  if (body.originalPrice !== undefined) {
    if (body.originalPrice === '' || body.originalPrice === null) {
      fields.originalPrice = null;
    } else {
      const originalPrice = Number(body.originalPrice);
      if (!Number.isFinite(originalPrice) || originalPrice < 0 || originalPrice > 10_000_000) {
        return { error: 'Enter a valid original price' };
      }
      fields.originalPrice = Math.round(originalPrice);
    }
  }

  if (body.isNegotiable !== undefined) {
    fields.isNegotiable = body.isNegotiable === 'true' || body.isNegotiable === true;
  }

  if (body.condition !== undefined) {
    const condition = asString(body.condition);
    if (!condition || !(ITEM_CONDITIONS as readonly string[]).includes(condition)) {
      return { error: 'Please choose a valid condition' };
    }
    fields.condition = condition;
  }

  if (body.meetAddress !== undefined) {
    if (typeof body.meetAddress !== 'string' || body.meetAddress.length > 200) {
      return { error: 'Meet address is too long' };
    }
    fields.meetAddress = body.meetAddress.trim();
  }

  if (
    fields.originalPrice != null &&
    fields.price !== undefined &&
    fields.originalPrice <= fields.price
  ) {
    // Not an error — it just isn't a discount, so don't show it
    fields.originalPrice = null;
  }

  return { fields };
};

// ============================================================
// POST /api/listings
//
// Create a new listing with image uploads.
// The seller's phone comes from the form; if their profile has no
// phone / meet address yet, we save these as their defaults.
// ============================================================
export const createListing = async (req: Request, res: Response): Promise<void> => {
  // Tracked outside try so we can clean up uploads if saving fails
  let imageUrls: string[] = [];
  try {
    const user = req.user!;

    const result = validateListingBody(req.body, false);
    if ('error' in result) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }
    const { fields } = result;

    const phone = req.body.sellerPhone !== undefined ? normalizePhone(req.body.sellerPhone) : user.phone;
    if (phone === null) {
      res.status(400).json({ success: false, message: 'Enter a valid 10-digit WhatsApp number' });
      return;
    }
    const sellerPhone = phone || user.phone || '';
    if (!sellerPhone) {
      res.status(400).json({
        success: false,
        message: 'Add a WhatsApp number so buyers can contact you',
      });
      return;
    }

    const meetAddress = fields.meetAddress || user.meetAddress || '';
    if (!meetAddress) {
      res.status(400).json({ success: false, message: 'Add a meet-up location' });
      return;
    }

    imageUrls = await uploadImages(req.files, 'listings');

    const listing = await Listing.create({
      sellerId: user._id,
      title: fields.title,
      description: fields.description || '',
      images: imageUrls,
      category: fields.category,
      price: fields.price,
      originalPrice: fields.originalPrice ?? undefined,
      isNegotiable: fields.isNegotiable ?? false,
      condition: fields.condition || 'Used - Good',
      sellerName: user.name,
      sellerPhone,
      meetAddress,
      status: 'ACTIVE',
    });

    // Remember contact details as profile defaults for next time
    const profileDefaults: Record<string, string> = {};
    if (!user.phone) profileDefaults.phone = sellerPhone;
    if (!user.meetAddress) profileDefaults.meetAddress = meetAddress;
    if (Object.keys(profileDefaults).length > 0) {
      await User.findByIdAndUpdate(user._id, { $set: profileDefaults });
    }

    invalidateListingsCache();

    res.status(201).json({
      success: true,
      data: listing,
      message: 'Listing created successfully',
    });
  } catch (error) {
    console.error('Create listing error:', error);
    deleteImages(imageUrls); // don't leave orphaned uploads behind
    res.status(500).json({ success: false, message: 'Failed to create listing' });
  }
};

// ============================================================
// GET /api/listings
//
// Browse listings with pagination, filtering, and sorting.
// Query params: page, limit, category, sort, search, cursor
// ============================================================
export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = asString(req.query.page) || '1';
    const limit = asString(req.query.limit) || '20';
    const rawCategory = asString(req.query.category);
    const rawSort = asString(req.query.sort) || 'newest';
    const search = asString(req.query.search, 100);
    const rawCursor = asString(req.query.cursor);
    const rawCondition = asString(req.query.condition);
    const minPrice = Number(asString(req.query.minPrice));
    const maxPrice = Number(asString(req.query.maxPrice));
    const freeOnly = asString(req.query.free) === '1';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const sort = (SORT_OPTIONS as readonly string[]).includes(rawSort) ? rawSort : 'newest';
    const category =
      rawCategory && (LISTING_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : undefined;
    const condition =
      rawCondition && (ITEM_CONDITIONS as readonly string[]).includes(rawCondition) ? rawCondition : undefined;
    // Cursor pagination only applies to date sorts
    const cursor =
      rawCursor && isObjectId(rawCursor) && (sort === 'newest' || sort === 'oldest') ? rawCursor : undefined;

    const skip = cursor ? 0 : (pageNum - 1) * limitNum;

    const includeSold = asString(req.query.includeSold) === '1' || asString(req.query.status) === 'SOLD';
    const statusOnly = asString(req.query.status);

    // Build filter query
    const filter: Record<string, unknown> = {};
    if (statusOnly === 'SOLD') {
      filter.status = 'SOLD';
    } else if (includeSold) {
      filter.$or = [
        { status: { $in: VISIBLE_STATUSES }, expiresAt: { $gt: new Date() } },
        { status: 'SOLD' },
      ];
    } else {
      filter.status = { $in: VISIBLE_STATUSES };
      filter.expiresAt = { $gt: new Date() };
    }
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (search) filter.$text = { $search: search };

    const priceFilter: Record<string, number> = {};
    if (freeOnly) {
      priceFilter.$lte = 0;
    } else {
      if (Number.isFinite(minPrice) && minPrice > 0) priceFilter.$gte = minPrice;
      if (Number.isFinite(maxPrice) && maxPrice >= 0 && asString(req.query.maxPrice)) priceFilter.$lte = maxPrice;
    }
    if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;

    // Base filter (without cursor) is used for the total count
    const countFilter = { ...filter };
    if (cursor) filter._id = sort === 'oldest' ? { $gt: cursor } : { $lt: cursor };

    let sortOption: Record<string, 1 | -1>;
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1, _id: -1 };
        break;
      case 'price_high':
        sortOption = { price: -1, _id: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1, _id: 1 };
        break;
      default:
        sortOption = { createdAt: -1, _id: -1 };
    }

    const cacheKey = [
      'listings', pageNum, limitNum, category || 'all', sort, search || '', cursor || '',
      condition || '', JSON.stringify(priceFilter),
    ].join('_');
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      res.status(200).json(cachedResponse);
      return;
    }

    // Fetch one extra item to know whether another page exists
    const [results, total] = await Promise.all([
      Listing.find(filter)
        .select({
          title: 1,
          price: 1,
          originalPrice: 1,
          status: 1,
          condition: 1,
          category: 1,
          meetAddress: 1,
          sellerName: 1,
          sellerId: 1,
          isNegotiable: 1,
          createdAt: 1,
          images: { $slice: 1 }, // Only fetch the first image for the feed
        })
        .populate('sellerId', 'name averageRating leavingDate isVerified')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum + 1)
        .lean(),
      Listing.countDocuments(countFilter),
    ]);

    const hasMore = results.length > limitNum;
    const listings = results.slice(0, limitNum);

    const responseData = {
      success: true,
      data: {
        listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore,
        },
      },
    };

    cache.set(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// ============================================================
// GET /api/listings/:id
//
// Single listing with seller info. Deleted listings are hidden
// from everyone except the owner and admins.
// ============================================================
export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id)
      .populate(
        'sellerId',
        'name profileImage averageRating totalRatings totalItemsSold meetAddress phone leavingDate isVerified createdAt'
      )
      .lean();

    const sellerId = (listing?.sellerId as { _id?: unknown } | undefined)?._id?.toString();
    const isOwner = !!req.userId && sellerId === req.userId;

    if (!listing || (listing.status === 'DELETED' && !isOwner && !isAdminUser(req.user))) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const isExpired =
      (listing.status === 'ACTIVE' || listing.status === 'RESERVED') && new Date(listing.expiresAt) <= new Date();

    res.status(200).json({
      success: true,
      data: { ...listing, isExpired, isOwner },
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listing' });
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
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'DELETED') {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
      return;
    }

    const result = validateListingBody(req.body, true);
    if ('error' in result) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }
    const { fields } = result;

    // Only allow keeping images that already belong to this listing
    let keptImages = listing.images;
    if (req.body.existingImages !== undefined) {
      let parsed: unknown = req.body.existingImages;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          res.status(400).json({ success: false, message: 'Invalid image list' });
          return;
        }
      }
      if (!Array.isArray(parsed)) {
        res.status(400).json({ success: false, message: 'Invalid image list' });
        return;
      }
      keptImages = parsed.filter(
        (url): url is string => typeof url === 'string' && listing.images.includes(url)
      );
    }

    const previousImages = [...listing.images];
    const newImageUrls = await uploadImages(req.files, 'listings');
    const finalImages = orderImages(req.body.imageOrder, keptImages, newImageUrls).slice(0, 4);
    listing.images = finalImages;

    if (fields.title !== undefined) listing.title = fields.title;
    if (fields.description !== undefined) listing.description = fields.description;
    if (fields.category !== undefined) listing.category = fields.category as typeof listing.category;
    if (fields.price !== undefined) listing.price = fields.price;
    if (fields.originalPrice !== undefined) {
      listing.originalPrice =
        fields.originalPrice != null && fields.originalPrice > listing.price ? fields.originalPrice : undefined;
    }
    if (fields.isNegotiable !== undefined) listing.isNegotiable = fields.isNegotiable;
    if (fields.condition !== undefined) listing.condition = fields.condition as typeof listing.condition;
    if (fields.meetAddress) listing.meetAddress = fields.meetAddress;

    try {
      await listing.save();
    } catch (saveError) {
      deleteImages(newImageUrls); // the edit didn't stick, so the new uploads are orphans
      throw saveError;
    }
    invalidateListingsCache();

    // Photos the seller removed (or that didn't fit in the 4-photo limit)
    deleteImages([...previousImages, ...newImageUrls].filter((url) => !finalImages.includes(url)));

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Listing updated successfully',
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to update listing' });
  }
};

// ============================================================
// PATCH /api/listings/:id/status
//
// Set listing status (ACTIVE / RESERVED / SOLD). Owner only.
// Keeps the seller's totalItemsSold counter in sync.
// ============================================================
export const updateListingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (status !== 'ACTIVE' && status !== 'SOLD' && status !== 'RESERVED') {
      res.status(400).json({ success: false, message: 'Status must be ACTIVE, RESERVED or SOLD' });
      return;
    }

    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'DELETED') {
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

    if (status === 'SOLD' && previousStatus !== 'SOLD') {
      await User.findByIdAndUpdate(listing.sellerId, { $inc: { totalItemsSold: 1 } });
    }
    if (status !== 'SOLD' && previousStatus === 'SOLD') {
      await User.findByIdAndUpdate(listing.sellerId, { $inc: { totalItemsSold: -1 } });
    }

    invalidateListingsCache();

    const label = status === 'ACTIVE' ? 'available' : status.toLowerCase();
    res.status(200).json({
      success: true,
      data: listing,
      message: `Listing marked as ${label}`,
    });
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
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'DELETED') {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Free up Cloudinary storage — the listing is gone for good
    const photos = [...listing.images];
    listing.status = 'DELETED';
    listing.images = [];
    await listing.save();
    deleteImages(photos);
    invalidateListingsCache();

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
};

// ============================================================
// GET /api/listings/stats
//
// Headline numbers for the home page hero (cached 60s).
// ============================================================
export const getMarketplaceStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = cache.get('marketplace_stats');
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const now = new Date();
    const liveFilter = { status: { $in: VISIBLE_STATUSES }, expiresAt: { $gt: now } };
    const monthAgo = new Date(now.getTime() - THIRTY_DAYS_MS);

    const [liveListings, sellers, soldThisMonth, freeItems] = await Promise.all([
      Listing.countDocuments(liveFilter),
      Listing.distinct('sellerId', liveFilter).then((ids) => ids.length),
      Listing.countDocuments({ status: 'SOLD', updatedAt: { $gt: monthAgo } }),
      Listing.countDocuments({ ...liveFilter, price: 0 }),
    ]);

    const body = { success: true, data: { liveListings, sellers, soldThisMonth, freeItems } };
    cache.set('marketplace_stats', body);
    res.status(200).json(body);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// ============================================================
// GET /api/listings/my
//
// The current user's listings (all statuses except DELETED).
// ============================================================
export const getMyListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await Listing.find({
      sellerId: req.userId,
      status: { $ne: 'DELETED' },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// ============================================================
// PATCH /api/listings/:id/renew
//
// Renew an active/expired listing for another 30 days.
// ============================================================
export const renewListing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'DELETED') {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    if (listing.sellerId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (listing.status === 'SOLD') {
      res.status(400).json({ success: false, message: 'Sold listings cannot be renewed' });
      return;
    }

    listing.expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    if (listing.status !== 'RESERVED') listing.status = 'ACTIVE';
    await listing.save();
    invalidateListingsCache();

    res.status(200).json({
      success: true,
      message: 'Listing renewed for 30 days',
      data: listing,
    });
  } catch (error) {
    console.error('Renew listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to renew listing' });
  }
};

// ============================================================
// DELETE /api/listings/:id/admin
//
// Admin-only (enforced by requireAdmin in the route).
// Removes the listing and resolves its open reports.
// ============================================================
export const adminDeleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    // Photos are kept on purpose: a reported listing (e.g. a suspected
    // stolen item) may still be needed as evidence by moderators.
    listing.status = 'DELETED';
    await listing.save();
    await Report.updateMany({ listingId: listing._id, status: 'PENDING' }, { status: 'REVIEWED' });
    invalidateListingsCache();

    res.status(200).json({ success: true, message: 'Listing removed by admin' });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
};
