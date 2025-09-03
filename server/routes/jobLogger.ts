import { Router } from 'express';
import { JobLogger } from '../services/jobLogger.js';

const router = Router();
const jobLogger = new JobLogger();

// Create a new job
router.post('/create', async (req, res) => {
  try {
    const { name, metadata } = req.body;
    const jobId = jobLogger.createJob(name, metadata);
    res.json({ jobId });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Log to a job
router.post('/log', async (req, res) => {
  try {
    const { jobId, level, message, step, metadata } = req.body;
    jobLogger.log(jobId, level, message, step, metadata);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging to job:', error);
    res.status(500).json({ error: 'Failed to log to job' });
  }
});

// Complete a job
router.post('/complete', async (req, res) => {
  try {
    const { jobId, status = 'completed' } = req.body;
    jobLogger.completeJob(jobId, status);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

export default router;