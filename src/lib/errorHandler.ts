import { toast } from 'sonner';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  provider?: string;
  operation?: string;
}

export class APIError extends Error implements ApiError {
  code?: string;
  status?: number;
  provider?: string;
  operation?: string;

  constructor(message: string, options: Partial<ApiError> = {}) {
    super(message);
    this.name = 'APIError';
    this.code = options.code;
    this.status = options.status;
    this.provider = options.provider;
    this.operation = options.operation;
  }
}

export function handleApiError(error: unknown, context?: string): string {
  console.error(`API Error ${context ? `in ${context}` : ''}:`, error);

  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle specific error patterns
    if (error.message.includes('API key')) {
      return 'Invalid API configuration. Please check your API keys.';
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'API rate limit exceeded. Please try again in a few moments.';
    }
    
    if (error.message.includes('timeout') || error.message.includes('408')) {
      return 'Request timed out. The operation may take longer than expected.';
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.message.includes('404')) {
      return 'Resource not found. The requested content may no longer be available.';
    }
    
    if (error.message.includes('403') || error.message.includes('unauthorized')) {
      return 'Access denied. Please check your authentication credentials.';
    }
    
    if (error.message.includes('500') || error.message.includes('internal server')) {
      return 'Server error. The service is temporarily unavailable.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function showErrorToast(error: unknown, context?: string) {
  const message = handleApiError(error, context);
  toast.error(message);
  return message;
}

export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    reject(lastError);
  });
}