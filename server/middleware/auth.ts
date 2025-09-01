import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

// Authentication middleware to verify Supabase JWT tokens
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      ok: false, 
      message: 'Authentication token required' 
    });
  }

  // In a real implementation, you would verify the JWT token here
  // For now, we'll implement a basic check and move to Supabase functions
  // which handle auth automatically
  
  // TODO: Implement proper JWT verification with Supabase
  // For development, allow requests to pass through with a warning
  console.warn('Authentication middleware: JWT verification not fully implemented');
  
  // Mock user for development
  req.user = {
    id: 'dev-user-id',
    email: 'dev@example.com'
  };

  next();
};

// Rate limiting middleware for expensive operations
export const rateLimitExpensive = (req: Request, res: Response, next: NextFunction) => {
  // Basic rate limiting - in production, use redis or similar
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  // TODO: Implement proper rate limiting
  console.log(`Rate limiting check for ${clientIp}`);
  
  next();
};