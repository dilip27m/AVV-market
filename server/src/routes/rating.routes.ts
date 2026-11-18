import { Router } from 'express';
import { rateSeller, getSellerRatings, getMyRatingForSeller } from '../controllers/rating.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected
router.post('/', authMiddleware, rateSeller);

router.get('/:sellerId/mine', authMiddleware, getMyRatingForSeller);

// Public
router.get('/:sellerId', getSellerRatings);

export default router;
