import { Router } from 'express';
import { JobLogger } from '../services/jobLogger';

const router = Router();
const jobLogger = new JobLogger();

// Get recent jobs
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;
    
    const jobs = await jobLogger.getRecentJobs({ limit, offset, status });
    
    res.json({
      jobs,
      total: jobs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
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