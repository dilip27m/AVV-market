import { Router } from 'express';
import {
  getWantedPosts,
  getMyWantedPosts,
  createWantedPost,
  updateWantedStatus,
  deleteWantedPost,
} from '../controllers/wanted.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getWantedPosts);
router.get('/my', authMiddleware, getMyWantedPosts);
router.post('/', authMiddleware, createWantedPost);
router.patch('/:id/status', authMiddleware, updateWantedStatus);
router.delete('/:id', authMiddleware, deleteWantedPost);

export default router;
