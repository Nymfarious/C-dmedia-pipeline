import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.supabase.co https://api.replicate.com; " +
    "frame-ancestors 'none';"
  );

  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

// Security event logging
export const logSecurityEvent = (event: string, details: any, req: Request) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  console.log(`🔒 SECURITY EVENT [${timestamp}]: ${event}`, {
    ip,
    userAgent,
    url: req.url,
    method: req.method,
    details
  });
};

// Rate limiting security middleware
export const securityRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Simple in-memory rate limiting for security events
  if (!global.securityLimits) {
    global.securityLimits = new Map();
  }
  
  const key = `security_${ip}`;
  const attempts = global.securityLimits.get(key) || { count: 0, resetTime: now + 60000 };
  
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + 60000; // 1 minute window
  }
  
  attempts.count++;
  global.securityLimits.set(key, attempts);
  
  // Log suspicious activity
  if (attempts.count > 10) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
      attempts: attempts.count,
      window: '1 minute'
    }, req);
    
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded for security endpoint'
    });
  }
  
  next();
};