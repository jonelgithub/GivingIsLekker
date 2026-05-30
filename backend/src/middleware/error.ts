import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Centralized error handler middleware.
 * Ensures the API never crashes and always returns structured JSON errors.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
  console.error(err.stack || err);

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack, details: err.details } : {}),
  });
};
