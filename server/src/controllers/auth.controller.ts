import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { isAdminUser } from '../middleware/auth.middleware';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// ============================================================
// Helpers
// ============================================================
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ userId, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

/** True if the email belongs to one of the configured college domains. */
export const isCollegeEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return env.COLLEGE_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
};

/** The shape of the logged-in user sent to the client. */
export const serializeUser = (user: IUser) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  phone: user.phone,
  meetAddress: user.meetAddress,
  averageRating: user.averageRating,
  totalRatings: user.totalRatings,
  totalItemsSold: user.totalItemsSold,
  leavingDate: user.leavingDate || null,
  isVerified: user.isVerified,
  isAdmin: isAdminUser(user),
  createdAt: user.createdAt,
});

// ============================================================
// POST /api/auth/google
//
// Receives Google ID token from the frontend,
// verifies it, creates/finds the user, returns JWT.
// ============================================================
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;

    if (typeof credential !== 'string' || !credential) {
      res.status(400).json({ success: false, message: 'Google credential is required' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!payload.email_verified) {
      res.status(401).json({ success: false, message: 'Please use a verified Google account' });
      return;
    }

    if (!email || !googleId) {
      res.status(400).json({ success: false, message: 'Could not retrieve email from Google account' });
      return;
    }

    const collegeEmail = isCollegeEmail(email);

    if (env.RESTRICT_TO_COLLEGE_DOMAINS && !collegeEmail && !env.ADMIN_EMAILS.includes(email.toLowerCase())) {
      res.status(403).json({
        success: false,
        message: `Please sign in with your college email (${env.COLLEGE_EMAIL_DOMAINS.map((d) => '@' + d).join(', ')}).`,
        code: 'COLLEGE_EMAIL_REQUIRED',
      });
      return;
    }

    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: name || 'Student',
        email,
        googleId,
        profileImage: picture || '',
        isVerified: collegeEmail,
      });
      isNewUser = true;
    } else if (user.isVerified !== collegeEmail) {
      // Domain config may have changed since the account was created
      user.isVerified = collegeEmail;
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

    res.status(200).json({
      success: true,
      data: {
        user: serializeUser(user),
        accessToken,
        refreshToken,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// ============================================================
// GET /api/auth/me
// ============================================================
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  res.status(200).json({ success: true, data: serializeUser(req.user) });
};

// ============================================================
// POST /api/auth/refresh
//
// Takes a refresh token, verifies it, issues new tokens.
// ============================================================
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (typeof token !== 'string' || !token) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; email: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const tokens = generateTokens(user._id.toString(), user.email);

    res.status(200).json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};
