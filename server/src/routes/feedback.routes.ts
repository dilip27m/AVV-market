import { Router } from 'express';
import {
  createFeedback,
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
} from '../controllers/feedback.controller';
import { authMiddleware, optionalAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public / optional auth: submit feedback or bug report
router.post('/', optionalAuth, createFeedback);

// Admin only: view, manage status, delete
router.get('/', authMiddleware, requireAdmin, getFeedbacks);
router.patch('/:id/status', authMiddleware, requireAdmin, updateFeedbackStatus);
router.delete('/:id', authMiddleware, requireAdmin, deleteFeedback);

export default router;
