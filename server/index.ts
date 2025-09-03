import express from 'express';
import cors from 'cors';
import replicateRoutes from './routes/replicate.js';
import unifiedRoutes from './routes/unified.js';
import renderRoutes from './routes/render.js';
import healthRoutes from './routes/health.js';
import jobRoutes from './routes/jobs.js';
import jobLoggerRoutes from './routes/jobLogger.js';
import templateRoutes from './routes/templates.js';
import { authenticateToken, rateLimitExpensive } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { securityHeaders, logSecurityEvent } from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Validate environment configuration
import { validateEnvironment, logServerConfig } from './utils/envValidation.js';

try {
  const envConfig = validateEnvironment();
  logServerConfig(envConfig);
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// CORS configuration - never allow wildcard in production
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];
    
    // Allow requests with no origin (mobile apps, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    
    if (allowedOrigins.indexOf(origin || '') !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(securityHeaders);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes with authentication for expensive operations
app.use('/api/replicate', authenticateToken, rateLimitExpensive, replicateRoutes);
app.use('/api/image', authenticateToken, rateLimitExpensive, unifiedRoutes);
app.use('/api/video', authenticateToken, rateLimitExpensive, unifiedRoutes);
app.use('/api/audio', authenticateToken, rateLimitExpensive, unifiedRoutes);
app.use('/api/render', authenticateToken, rateLimitExpensive, renderRoutes);
app.use('/api/templates', templateRoutes);

// Health and monitoring (no auth required)
app.use('/api/health', healthRoutes);
app.use('/api/jobs', authenticateToken, jobRoutes);
app.use('/api/jobs', jobLoggerRoutes); // Public logging endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Frame Fuser API Server is running' });
});

// Global error handlers
app.use(errorHandler);
app.use('*', notFoundHandler);

app.listen(PORT, () => {
  console.log(`🚀 Frame Fuser API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛠️ Debug: NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`🔧 Debug: Available routes:`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/health/*`);
  console.log(`   - GET  /api/jobs/*`);
  console.log(`   - POST /api/replicate/*`);
  console.log(`   - POST /api/image/*`);
  console.log(`   - POST /api/render/*`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});