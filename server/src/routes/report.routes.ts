import { Router } from 'express';
import { reportListing, getReports, updateReportStatus } from '../controllers/report.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protected — must be logged in to report
router.post('/', authMiddleware, reportListing);

// Admin / Dashboard routes
router.get('/', authMiddleware, requireAdmin, getReports);
router.patch('/:id/status', authMiddleware, requireAdmin, updateReportStatus);

export default router;
