import { Router } from 'express';
import { googleLogin, getMe, refreshToken } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public
router.post('/google', googleLogin);
router.post('/refresh', refreshToken);

// Protected
router.get('/me', authMiddleware, getMe);

export default router;
