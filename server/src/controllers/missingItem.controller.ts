import { Request, Response } from 'express';
import { MissingItem } from '../models/MissingItem';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

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
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
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
// POST /api/missing-items
//
// Report a lost/stolen item. Other students can cross-check
// marketplace listings against these reports.
// ============================================================
export const createMissingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, category, lastSeenLocation, lastSeenDate } = req.body;

    // Upload images concurrently
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, 'avv-market/missing')
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map(result => result.secure_url);
    }

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
    const {
      page = '1',
      limit = '20',
      search,
      status = 'MISSING',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {
      status: status as string,
    };

    if (search) {
      filter.$text = { $search: search as string };
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

    res.status(200).json({
      success: true,
      message: 'Missing item report deleted',
    });
  } catch (error) {
    console.error('Delete missing item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};
