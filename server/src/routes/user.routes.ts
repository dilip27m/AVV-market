import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  getUserListings,
  toggleWishlist,
  getWishlist,
  deleteMyAccount,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/user.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protected
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteMyAccount);
router.post('/wishlist/:listingId', authMiddleware, toggleWishlist);
router.get('/me/wishlist', authMiddleware, getWishlist);

// Admin moderation
router.get('/admin/blocked', authMiddleware, requireAdmin, getBlockedUsers);
router.post('/:id/block', authMiddleware, requireAdmin, blockUser);
router.post('/:id/unblock', authMiddleware, requireAdmin, unblockUser);

// Public
router.get('/:id', getUserProfile);
router.get('/:id/listings', getUserListings);

export default router;
