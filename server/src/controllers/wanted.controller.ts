import { Request, Response } from 'express';
import { WantedPost, WANTED_STATUS } from '../models/WantedPost';
import { LISTING_CATEGORIES } from '../models/Listing';
import { asString, isObjectId } from '../utils/validate';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ============================================================
// GET /api/wanted
//
// Open requests, newest first. The requester's phone is only
// included for logged-in users (keeps numbers away from scrapers).
// ============================================================
export const getWantedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(asString(req.query.page) || '1', 10) || 1);
    const limit = 30;
    const rawCategory = asString(req.query.category);

    const filter: Record<string, unknown> = { status: 'OPEN', expiresAt: { $gt: new Date() } };
    if (rawCategory && (LISTING_CATEGORIES as readonly string[]).includes(rawCategory)) {
      filter.category = rawCategory;
    }

    const userFields = req.userId ? 'name profileImage phone isVerified' : 'name profileImage isVerified';

    const [posts, total] = await Promise.all([
      WantedPost.find(filter)
        .populate('userId', userFields)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WantedPost.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { posts, pagination: { page, total, hasMore: page * limit < total } },
    });
  } catch (error) {
    console.error('Get wanted posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

// ============================================================
// GET /api/wanted/my
// ============================================================
export const getMyWantedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await WantedPost.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error('Get my wanted posts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your requests' });
  }
};

// ============================================================
// POST /api/wanted
// ============================================================
export const createWantedPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const title = asString(req.body.title, 500);
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const category = asString(req.body.category) || 'Others';
    const budgetRaw = req.body.budget;

    if (!title || title.length < 3 || title.length > 120) {
      res.status(400).json({ success: false, message: 'Title must be 3–120 characters' });
      return;
    }
    if (description.length > 500) {
      res.status(400).json({ success: false, message: 'Description cannot exceed 500 characters' });
      return;
    }
    if (!(LISTING_CATEGORIES as readonly string[]).includes(category)) {
      res.status(400).json({ success: false, message: 'Please choose a valid category' });
      return;
    }

    let budget: number | undefined;
    if (budgetRaw !== undefined && budgetRaw !== '' && budgetRaw !== null) {
      budget = Number(budgetRaw);
      if (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000) {
        res.status(400).json({ success: false, message: 'Enter a valid budget' });
        return;
      }
      budget = Math.round(budget);
    }

    const openCount = await WantedPost.countDocuments({ userId: user._id, status: 'OPEN' });
    if (openCount >= 10) {
      res.status(400).json({ success: false, message: 'You can have up to 10 open requests. Close some first.' });
      return;
    }

    const post = await WantedPost.create({
      userId: user._id,
      userName: user.name,
      title,
      description,
      category,
      budget,
    });

    res.status(201).json({ success: true, data: post, message: 'Request posted' });
  } catch (error) {
    console.error('Create wanted post error:', error);
    res.status(500).json({ success: false, message: 'Failed to post request' });
  }
};

// Shared owner check for status/delete
const findOwnPost = async (req: Request, res: Response) => {
  if (!isObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return null;
  }
  const post = await WantedPost.findById(req.params.id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return null;
  }
  if (post.userId.toString() !== req.userId) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return null;
  }
  return post;
};

// ============================================================
// PATCH /api/wanted/:id/status  (owner only)
// ============================================================
export const updateWantedStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!(WANTED_STATUS as readonly string[]).includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const post = await findOwnPost(req, res);
    if (!post) return;

    post.status = status;
    if (status === 'OPEN') post.expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Update wanted status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
};

// ============================================================
// DELETE /api/wanted/:id  (owner only)
// ============================================================
export const deleteWantedPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await findOwnPost(req, res);
    if (!post) return;

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Request deleted' });
  } catch (error) {
    console.error('Delete wanted post error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
};
