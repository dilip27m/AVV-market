import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// ============================================================
// Error Response Interface
// ============================================================
interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: number | string;
}

// ============================================================
// Global Error Handler
//
// All errors bubble up here. Catches Mongoose validation errors,
// duplicate key errors, and generic server errors.
// ============================================================
export const errorMiddleware = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err.message);

  // Upload errors (file too large, too many files, wrong type)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 5MB.'
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Too many images.'
      : 'Image upload failed.';
    res.status(400).json({ success: false, message });
    return;
  }
  if (err.message === 'Only image files are allowed') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message,
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
    });
    return;
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    // Don't leak internal error details to clients
    message: statusCode < 500 ? err.message : 'Internal server error',
  });
};
