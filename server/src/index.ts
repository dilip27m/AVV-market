import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDB } from './config/db';
import { errorMiddleware } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import userRoutes from './routes/user.routes';
import ratingRoutes from './routes/rating.routes';
import reportRoutes from './routes/report.routes';
import missingItemRoutes from './routes/missingItem.routes';
import commentRoutes from './routes/comment.routes';

import compression from 'compression';
import helmet from 'helmet';

// ============================================================
// Express App Setup
// ============================================================
const app = express();

// Render / Vercel sit behind a proxy — trust it so rate limiting sees real client IPs
app.set('trust proxy', 1);

// --- Middleware ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS — only allow requests from the frontend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON body (images go through multipart, so JSON bodies stay small)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting — prevent abuse on auth and creation endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // max 15 listings per hour
  message: { success: false, message: 'Too many listings created. Please wait.' },
});

const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: { success: false, message: 'You are commenting too fast. Please slow down.' },
});

const ratingReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AVV Market API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// --- Write-endpoint rate limiters (must be registered BEFORE the routers) ---
app.post('/api/listings', createLimiter);
app.post('/api/missing-items', createLimiter);
app.post('/api/comments/:listingId', commentLimiter);
app.post('/api/ratings', ratingReportLimiter);
app.post('/api/reports', ratingReportLimiter);

// --- Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/missing-items', missingItemRoutes);
app.use('/api/comments', commentRoutes);

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// --- Error Handler (must be last) ---
app.use(errorMiddleware);

// ============================================================
// Start Server
// ============================================================
const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   🏪 AVV Market API Server            ║
    ║   Port: ${env.PORT}                          ║
    ║   Env:  ${env.NODE_ENV.padEnd(26)}║
    ║   URL:  http://localhost:${env.PORT}         ║
    ╚═══════════════════════════════════════╝
    `);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
