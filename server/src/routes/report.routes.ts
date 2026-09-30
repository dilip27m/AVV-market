import { Router } from 'express';
import { reportListing } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected — must be logged in to report
router.post('/', authMiddleware, reportListing);

export default router;
