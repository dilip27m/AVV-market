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

// ============================================================
// Express App Setup
// ============================================================
const app = express();

// --- Middleware ---

// CORS — only allow requests from the frontend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON body (limit to 10MB for image uploads via base64 fallback)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AVV Market API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// --- Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/missing-items', missingItemRoutes);
app.use('/api/comments', commentRoutes);

// Apply creation rate limiter specifically to listing/missing-item creation
app.post('/api/listings', createLimiter);
app.post('/api/missing-items', createLimiter);

// --- Error Handler (must be last) ---
app.use(errorMiddleware);

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

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
