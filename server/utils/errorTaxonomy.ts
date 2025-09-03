// Standardized error taxonomy for user-facing messages

export enum ErrorCode {
  // Authentication errors
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // Processing errors
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  VIDEO_PROCESSING_FAILED = 'VIDEO_PROCESSING_FAILED',
  AUDIO_PROCESSING_FAILED = 'AUDIO_PROCESSING_FAILED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface UserFacingError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  retryAfter?: number;
  suggestedAction?: string;
}

export const ERROR_MESSAGES: Record<ErrorCode, UserFacingError> = {
  [ErrorCode.AUTH_TOKEN_MISSING]: {
    code: ErrorCode.AUTH_TOKEN_MISSING,
    message: 'Authentication token required',
    userMessage: 'Please log in to continue',
    retryable: false,
    suggestedAction: 'Sign in to your account'
  },
  
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    code: ErrorCode.AUTH_TOKEN_INVALID,
    message: 'Invalid authentication token',
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
    suggestedAction: 'Sign in again'
  },
  
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
    message: 'Authentication token expired',
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
    suggestedAction: 'Refresh your session'
  },
  
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    userMessage: 'You are making requests too quickly. Please wait a moment and try again.',
    retryable: true,
    suggestedAction: 'Wait before retrying'
  },
  
  [ErrorCode.VALIDATION_FAILED]: {
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Request validation failed',
    userMessage: 'The request contains invalid data. Please check your inputs.',
    retryable: false,
    suggestedAction: 'Check your input and try again'
  },
  
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: 'Service temporarily unavailable',
    userMessage: 'The service is temporarily unavailable. Please try again in a few minutes.',
    retryable: true,
    retryAfter: 300, // 5 minutes
    suggestedAction: 'Try again later'
  },
  
  [ErrorCode.EXTERNAL_API_ERROR]: {
    code: ErrorCode.EXTERNAL_API_ERROR,
    message: 'External service error',
    userMessage: 'An external service is experiencing issues. Please try again later.',
    retryable: true,
    retryAfter: 60, // 1 minute
    suggestedAction: 'Try again in a few minutes'
  },
  
  [ErrorCode.TIMEOUT_ERROR]: {
    code: ErrorCode.TIMEOUT_ERROR,
    message: 'Request timeout',
    userMessage: 'The request took too long to complete. Please try again.',
    retryable: true,
    suggestedAction: 'Try again with a simpler request'
  },
  
  [ErrorCode.IMAGE_PROCESSING_FAILED]: {
    code: ErrorCode.IMAGE_PROCESSING_FAILED,
    message: 'Image processing failed',
    userMessage: 'Failed to process the image. Please check the image format and try again.',
    retryable: true,
    suggestedAction: 'Try with a different image or format'
  },
  
  [ErrorCode.VIDEO_PROCESSING_FAILED]: {
    code: ErrorCode.VIDEO_PROCESSING_FAILED,
    message: 'Video processing failed',
    userMessage: 'Failed to process the video. Please try again or contact support.',
    retryable: true,
    suggestedAction: 'Try again or contact support'
  },
  
  [ErrorCode.AUDIO_PROCESSING_FAILED]: {
    code: ErrorCode.AUDIO_PROCESSING_FAILED,
    message: 'Audio processing failed',
    userMessage: 'Failed to generate audio. Please try again.',
    retryable: true,
    suggestedAction: 'Try again with different settings'
  },
  
  [ErrorCode.FILE_TOO_LARGE]: {
    code: ErrorCode.FILE_TOO_LARGE,
    message: 'File size exceeds limit',
    userMessage: 'The file is too large. Please use a smaller file.',
    retryable: false,
    suggestedAction: 'Reduce file size and try again'
  },
  
  [ErrorCode.INSUFFICIENT_QUOTA]: {
    code: ErrorCode.INSUFFICIENT_QUOTA,
    message: 'Insufficient quota',
    userMessage: 'You have reached your usage limit. Please upgrade your plan or wait for quota reset.',
    retryable: false,
    suggestedAction: 'Upgrade plan or wait for quota reset'
  },
  
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. Please try again or contact support.',
    retryable: true,
    suggestedAction: 'Try again or contact support'
  },
  
  [ErrorCode.CONFIGURATION_ERROR]: {
    code: ErrorCode.CONFIGURATION_ERROR,
    message: 'Server configuration error',
    userMessage: 'The service is not properly configured. Please contact support.',
    retryable: false,
    suggestedAction: 'Contact support'
  },
  
  [ErrorCode.REQUIRED_FIELD_MISSING]: {
    code: ErrorCode.REQUIRED_FIELD_MISSING,
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
    retryable: false,
    suggestedAction: 'Complete all required fields'
  },
  
  [ErrorCode.INVALID_FORMAT]: {
    code: ErrorCode.INVALID_FORMAT,
    message: 'Invalid format',
    userMessage: 'The data format is invalid. Please check your input.',
    retryable: false,
    suggestedAction: 'Check input format and try again'
  },
  
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    message: 'Resource not found',
    userMessage: 'The requested resource was not found.',
    retryable: false,
    suggestedAction: 'Check the resource exists'
  }
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly userMessage: string;
  public readonly suggestedAction?: string;

  constructor(
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    stack?: string
  ) {
    const errorInfo = ERROR_MESSAGES[code];
    super(errorInfo.message);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.retryable = errorInfo.retryable;
    this.retryAfter = errorInfo.retryAfter;
    this.userMessage = errorInfo.userMessage;
    this.suggestedAction = errorInfo.suggestedAction;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Helper functions to create common errors
export const createAuthError = (code: ErrorCode = ErrorCode.AUTH_TOKEN_INVALID) => 
  new AppError(code, 401);

export const createValidationError = (code: ErrorCode = ErrorCode.VALIDATION_FAILED) => 
  new AppError(code, 400);

export const createRateLimitError = (retryAfter?: number) => {
  const error = new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 429);
  if (retryAfter) {
    (error as any).retryAfter = retryAfter;
  }
  return error;
};

export const createServiceError = (code: ErrorCode = ErrorCode.EXTERNAL_API_ERROR) => 
  new AppError(code, 503);

export const createProcessingError = (type: 'image' | 'video' | 'audio') => {
  const codeMap = {
    image: ErrorCode.IMAGE_PROCESSING_FAILED,
    video: ErrorCode.VIDEO_PROCESSING_FAILED,
    audio: ErrorCode.AUDIO_PROCESSING_FAILED
  };
  return new AppError(codeMap[type], 500);
};