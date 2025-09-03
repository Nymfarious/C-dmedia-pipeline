import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

// Authentication middleware to verify Supabase JWT tokens
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Authentication token required' 
      });
    }

    // Verify JWT with Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://ghfrddcmkexifhcwyupu.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return res.status(500).json({ 
        ok: false, 
        message: 'Server authentication not configured' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Authentication service error' 
    });
  }
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware for expensive operations
export const rateLimitExpensive = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = (req as AuthenticatedRequest).user?.id;
  const key = userId ? `user:${userId}` : `ip:${clientIp}`;
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10; // 10 requests per 15 minutes for expensive operations
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now > v.resetTime) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    res.set('Retry-After', retryAfter.toString());
    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', current.resetTime.toString());
    
    return res.status(429).json({
      ok: false,
      message: 'Rate limit exceeded. Too many expensive operations.',
      retryAfter
    });
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  
  // Set rate limit headers
  res.set('X-RateLimit-Limit', maxRequests.toString());
  res.set('X-RateLimit-Remaining', (maxRequests - current.count).toString());
  res.set('X-RateLimit-Reset', current.resetTime.toString());
  
  next();
};