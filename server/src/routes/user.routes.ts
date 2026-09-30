import { Router } from 'express';
import { getUserProfile, updateProfile, getUserListings } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected
router.put('/me', authMiddleware, updateProfile);

// Public
router.get('/:id', getUserProfile);
router.get('/:id/listings', getUserListings);

export default router;
