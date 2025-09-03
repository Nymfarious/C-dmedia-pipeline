import { Router } from 'express';
import { JobLogger } from '../services/jobLogger.js';

const router = Router();
const jobLogger = new JobLogger();

// Get recent jobs
router.get('/recent', (req, res) => {
  try {
    console.log('🔍 Jobs request received for /recent');
    const limit = parseInt(req.query.limit as string) || 20;
    const jobs = jobLogger.getRecentJobs(limit);
    console.log(`📊 Returning ${jobs.length} recent jobs`);
    res.json({ jobs, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Error fetching recent jobs:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch recent jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific job details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await jobLogger.getJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Get logs for a specific job
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await jobLogger.getJobLogs(id);
    
    if (!logs) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ job_id: id, logs });
  } catch (error) {
    console.error('Error fetching job logs:', error);
    res.status(500).json({ error: 'Failed to fetch job logs' });
  }
});

// Get job statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await jobLogger.getJobStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export default router;