import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { validationResult } from 'express-validator';
import * as Sentry from '@sentry/node';
import logger from '../config/logger';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';

interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: any[];
  stack?: string;
}

// Handle Prisma errors
const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return new ConflictError(`${field} already exists`);
      
      case 'P2025':
        // Record not found
        return new NotFoundError('Resource not found');
      
      case 'P2003':
        // Foreign key constraint violation
        return new ValidationError('Invalid reference to related resource');
      
      case 'P2014':
        // Required relation violation
        return new ValidationError('Required relation missing');
      
      default:
        return new AppError('Database operation failed', 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided');
  }

  return new AppError('Database error', 500);
};

// Handle JWT errors
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token has expired');
  }
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active yet');
  }
  return new AuthenticationError('Token verification failed');
};

// Handle validation errors
const handleValidationErrors = (error: any): AppError => {
  const errors = validationResult(error);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg).join(', ');
    return new ValidationError(messages);
  }
  return new ValidationError('Validation failed');
};

// Format error response
const formatErrorResponse = (
  error: AppError,
  includeStack: boolean = false
): ErrorResponse => {
  const response: ErrorResponse = {
    status: 'error',
    message: error.message,
  };

  // Include stack trace in development
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// Log error
const logError = (error: AppError, req: Request): void => {
  const logData = {
    message: error.message,
    statusCode: error.statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    stack: error.stack,
  };

  if (error.statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client error', logData);
  }
};

// Send error to Sentry in production
const sendToSentry = (error: AppError, req: Request): void => {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SENTRY_ENABLED === 'true'
  ) {
    Sentry.captureException(error, {
      tags: {
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
      },
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
      } : undefined,
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
      },
    });
  }
};

// Main error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  // Convert known errors to AppError
  if (err instanceof AppError) {
    error = err;
  } else if (err.name && err.name.includes('Prisma')) {
    error = handlePrismaError(err);
  } else if (err.name && (err.name.includes('JsonWebToken') || err.name.includes('Token'))) {
    error = handleJWTError(err);
  } else if (err.array && typeof err.array === 'function') {
    error = handleValidationErrors(err);
  } else {
    // Unknown error
    error = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message || 'Internal server error',
      err.statusCode || 500,
      false
    );
  }

  // Log error
  logError(error, req);

  // Send to Sentry if operational error in production
  if (!error.isOperational) {
    sendToSentry(error, req);
  }

  // Format and send response
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const response = formatErrorResponse(error, isDevelopment);

  // Don't leak sensitive information in production
  if (!isDevelopment && error.statusCode >= 500) {
    response.message = 'An unexpected error occurred';
  }

  res.status(error.statusCode).json(response);
};

// Handle 404 errors (route not found)
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Graceful shutdown error handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Optional: Exit process
  // process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Exit process on uncaught exception
  process.exit(1);
});
