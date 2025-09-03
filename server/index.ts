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

const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['REPLICATE_API_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// CORS configuration - restrict origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com']) 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));

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
});