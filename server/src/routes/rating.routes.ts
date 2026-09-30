import { Router } from 'express';
import { rateSeller, getSellerRatings } from '../controllers/rating.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected
router.post('/', authMiddleware, rateSeller);

// Public
router.get('/:sellerId', getSellerRatings);

export default router;
