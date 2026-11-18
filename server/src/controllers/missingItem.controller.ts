import { Request, Response } from 'express';
import { MissingItem, MISSING_STATUS } from '../models/MissingItem';
import { asString } from '../utils/validate';
import { uploadImages, deleteImages } from '../utils/images';

// ============================================================
// POST /api/missing-items
//
// Report a lost/stolen item. Other students can cross-check
// marketplace listings against these reports.
// ============================================================
export const createMissingItem = async (req: Request, res: Response): Promise<void> => {
  // Tracked outside try so we can clean up uploads if saving fails
  let imageUrls: string[] = [];
  try {
    const user = req.user!;
    const { title, description, category, lastSeenLocation, lastSeenDate } = req.body;

    imageUrls = await uploadImages(req.files, 'missing');

    const missingItem = await MissingItem.create({
      reporterId: user._id,
      title,
      description: description || '',
      images: imageUrls,
      category: category || 'Others',
      lastSeenLocation,
      lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : new Date(),
      contactPhone: user.phone || '',
      reporterName: user.name,
    });

    res.status(201).json({
      success: true,
      data: missingItem,
      message: 'Missing item reported successfully',
    });
  } catch (error) {
    console.error('Create missing item error:', error);
    deleteImages(imageUrls); // don't leave orphaned uploads behind
    res.status(500).json({
      success: false,
      message: 'Failed to report missing item',
    });
  }
};

// ============================================================
// GET /api/missing-items
//
// Browse missing items. Shows MISSING status by default.
// ============================================================
export const getMissingItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = asString(req.query.page) || '1';
    const limit = asString(req.query.limit) || '20';
    const search = asString(req.query.search, 100);
    const rawStatus = asString(req.query.status) || 'MISSING';
    const status = (MISSING_STATUS as readonly string[]).includes(rawStatus) ? rawStatus : 'MISSING';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {
      status,
    };

    if (search) {
      filter.$text = { $search: search };
    }

    const [items, total] = await Promise.all([
      MissingItem.find(filter)
        .populate('reporterId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MissingItem.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore: skip + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error('Get missing items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch missing items',
    });
  }
};

// ============================================================
// GET /api/missing-items/:id
// ============================================================
export const getMissingItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MissingItem.findById(req.params.id)
      .populate('reporterId', 'name profileImage phone')
      .lean();

    if (!item) {
      res.status(404).json({ success: false, message: 'Missing item not found' });
      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error('Get missing item error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch missing item' });
  }
};

// ============================================================
// PATCH /api/missing-items/:id/status
//
// Mark as FOUND or CLOSED. Reporter only.
// ============================================================
export const updateMissingItemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['MISSING', 'FOUND', 'CLOSED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be MISSING, FOUND, or CLOSED',
      });
      return;
    }

    const item = await MissingItem.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Missing item not found' });
      return;
    }

    if (item.reporterId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    item.status = status;
    await item.save();

    res.status(200).json({
      success: true,
      data: item,
      message: `Item marked as ${status.toLowerCase()}`,
    });
  } catch (error) {
    console.error('Update missing item status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ============================================================
// DELETE /api/missing-items/:id
//
// Delete a missing item report. Reporter only.
// ============================================================
export const deleteMissingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await MissingItem.findById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Missing item not found' });
      return;
    }

    if (item.reporterId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    await MissingItem.findByIdAndDelete(req.params.id);
    deleteImages(item.images);

    res.status(200).json({
      success: true,
      message: 'Missing item report deleted',
    });
  } catch (error) {
    console.error('Delete missing item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};
