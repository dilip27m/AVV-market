import { Router } from 'express';
import { reportListing, getReports, updateReportStatus } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected — must be logged in to report
router.post('/', authMiddleware, reportListing);

// Admin / Dashboard routes
router.get('/', authMiddleware, getReports);
router.patch('/:id/status', authMiddleware, updateReportStatus);

export default router;
