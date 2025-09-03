import { Router } from 'express';
import { AdapterHealthMonitor } from '../services/healthMonitor.js';

const router = Router();
const healthMonitor = new AdapterHealthMonitor();

// Overall health endpoint
router.get('/', async (req, res) => {
  try {
    const health = await healthMonitor.checkOverallHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'failed',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Individual adapter health
router.get('/adapters', async (req, res) => {
  try {
    const adapters = await healthMonitor.checkAllAdapters();
    res.json({ adapters, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Adapter health check error:', error);
    res.status(500).json({
      error: 'Adapter health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Specific adapter health
router.get('/adapters/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const health = await healthMonitor.checkAdapter(name);
    
    if (!health) {
      return res.status(404).json({ error: 'Adapter not found' });
    }
    
    res.json(health);
  } catch (error) {
    console.error(`Health check error for ${req.params.name}:`, error);
    res.status(500).json({
      error: 'Adapter health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;