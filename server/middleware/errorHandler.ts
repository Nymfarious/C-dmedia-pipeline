import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500, isOperational: boolean = true): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  return error;
};

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Check if it's our custom AppError with user-facing messages
  const isAppError = err.constructor.name === 'AppError';
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let userMessage = 'Something went wrong. Please try again.';
  let retryable = false;
  let retryAfter: number | undefined;
  let suggestedAction: string | undefined;

  if (isAppError) {
    // Use structured error information
    const appErr = err as any;
    statusCode = appErr.statusCode;
    message = appErr.message;
    userMessage = appErr.userMessage;
    retryable = appErr.retryable;
    retryAfter = appErr.retryAfter;
    suggestedAction = appErr.suggestedAction;
  } else {
    // Handle legacy error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      userMessage = 'Please check your input and try again.';
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Authentication required';
      userMessage = 'Please log in to continue.';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Access forbidden';
      userMessage = 'You do not have permission to perform this action.';
    }

    // Don't expose internal errors in production
    if (!err.isOperational && process.env.NODE_ENV === 'production') {
      message = 'Something went wrong';
      userMessage = 'Something went wrong on our end. Please try again later.';
    }
  }

  // Set retry headers for rate limiting
  if (retryAfter) {
    res.set('Retry-After', retryAfter.toString());
  }

  res.status(statusCode).json({
    ok: false,
    message,
    userMessage,
    retryable,
    retryAfter,
    suggestedAction,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
};