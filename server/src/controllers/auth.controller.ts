import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// ============================================================
// Helper: Generate JWT tokens
// ============================================================
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// ============================================================
// POST /api/auth/google
// 
// Receives Google ID token from the frontend,
// verifies it, creates/finds the user, returns JWT.
// ============================================================
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
      return;
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      res.status(400).json({
        success: false,
        message: 'Could not retrieve email from Google account',
      });
      return;
    }

    // Find existing user or create new one
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: name || 'Student',
        email,
        googleId,
        profileImage: picture || '',
      });
      isNewUser = true;
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          phone: user.phone,
          meetAddress: user.meetAddress,
          averageRating: user.averageRating,
          totalRatings: user.totalRatings,
          totalItemsSold: user.totalItemsSold,
        },
        accessToken,
        refreshToken,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// ============================================================
// GET /api/auth/me
//
// Returns the current authenticated user's profile.
// Requires valid JWT in Authorization header.
// ============================================================
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        phone: user.phone,
        meetAddress: user.meetAddress,
        averageRating: user.averageRating,
        totalRatings: user.totalRatings,
        totalItemsSold: user.totalItemsSold,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

// ============================================================
// POST /api/auth/refresh
//
// Takes a refresh token, verifies it, issues new access token.
// ============================================================
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.email
    );

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};
