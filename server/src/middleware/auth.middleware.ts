import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';

// ============================================================
// Extend Express Request to include user
// ============================================================
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

// ============================================================
// JWT Authentication Middleware
// 
// Verifies the access token from the Authorization header.
// Attaches the user document to req.user for downstream handlers.
// ============================================================
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Optional auth middleware — doesn't block the request if no token,
 * but attaches user info if a valid token is present.
 * Useful for public pages that show extra info for logged-in users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
      };
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }
  } catch {
    // Silently continue — optional auth should never block
  }

  next();
};

/**
 * Returns true if the user is an admin — either via the `role` field
 * or because their email is listed in the ADMIN_EMAILS env var.
 */
export const isAdminUser = (user?: IUser | null): boolean =>
  !!user && (user.role === 'admin' || env.ADMIN_EMAILS.includes(user.email.toLowerCase()));

/**
 * Admin-only guard. Must be used AFTER authMiddleware.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!isAdminUser(req.user)) {
    res.status(403).json({ success: false, message: 'Admin access required.' });
    return;
  }
  next();
};
