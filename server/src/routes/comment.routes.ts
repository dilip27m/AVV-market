import { Router } from 'express';
import { getCommentsForListing, addComment, deleteComment } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public route to view comments
router.get('/:listingId', getCommentsForListing);

// Protected routes to add/delete comments
router.post('/:listingId', authMiddleware, addComment);
router.delete('/:id', authMiddleware, deleteComment);

export default router;
