import { Router } from 'express';
import {
  createMissingItem,
  getMissingItems,
  getMissingItemById,
  updateMissingItemStatus,
  deleteMissingItem,
} from '../controllers/missingItem.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public
router.get('/', getMissingItems);
router.get('/:id', getMissingItemById);

// Protected
router.post('/', authMiddleware, upload.array('images', 3), createMissingItem);
router.patch('/:id/status', authMiddleware, updateMissingItemStatus);
router.delete('/:id', authMiddleware, deleteMissingItem);

export default router;
