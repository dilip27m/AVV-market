import { Request, Response, NextFunction } from 'express';

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
    message: err.message || 'Internal server error',
  });
};
