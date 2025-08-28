import express from 'express';
import cors from 'cors';
import replicateRoutes from './routes/replicate.js';
import unifiedRoutes from './routes/unified.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/replicate', replicateRoutes);
app.use('/api/image', unifiedRoutes);
app.use('/api/video', unifiedRoutes);
app.use('/api/audio', unifiedRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Frame Fuser API Server is running' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    ok: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Frame Fuser API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});