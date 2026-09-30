import { Router } from 'express';
import { getUserProfile, updateProfile, getUserListings, rateUser, toggleWishlist, getWishlist } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected
router.put('/me', authMiddleware, updateProfile);
router.post('/wishlist/:listingId', authMiddleware, toggleWishlist);
router.get('/me/wishlist', authMiddleware, getWishlist);
router.post('/:id/rate', authMiddleware, rateUser);

// Public
router.get('/:id', getUserProfile);
router.get('/:id/listings', getUserListings);

export default router;
