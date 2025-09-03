import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdapterHealthMonitor } from '../../server/services/healthMonitor';
import { JobLogger } from '../../server/services/jobLogger';

// Mock fetch
global.fetch = vi.fn();

describe('Health Monitor', () => {
  let healthMonitor: AdapterHealthMonitor;

  beforeEach(() => {
    healthMonitor = new AdapterHealthMonitor();
    vi.clearAllMocks();
  });

  describe('checkOverallHealth', () => {
    it('should return healthy status when all adapters are healthy', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      } as Response);

      const health = await healthMonitor.checkOverallHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.summary.healthy).toBeGreaterThan(0);
      expect(health.summary.failed).toBe(0);
    });

    it('should return degraded status when some adapters are degraded', async () => {
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        const status = callCount <= 2 ? 'healthy' : 'degraded';
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status })
        } as Response);
      });

      const health = await healthMonitor.checkOverallHealth();
      
      expect(health.status).toBe('degraded');
      expect(health.summary.degraded).toBeGreaterThan(0);
    });

    it('should return failed status when adapters are failing', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const health = await healthMonitor.checkOverallHealth();
      
      expect(health.status).toBe('failed');
      expect(health.summary.failed).toBeGreaterThan(0);
    });
  });

  describe('checkAdapter', () => {
    it('should check individual adapter health', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      } as Response);

      const health = await healthMonitor.checkAdapter('replicate-flux');
      
      expect(health).toBeTruthy();
      expect(health?.name).toBe('replicate-flux');
      expect(health?.status).toBe('healthy');
      expect(health?.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return null for unknown adapter', async () => {
      const health = await healthMonitor.checkAdapter('unknown-adapter');
      expect(health).toBeNull();
    });

    it('should handle adapter errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Connection failed'));

      const health = await healthMonitor.checkAdapter('replicate-flux');
      
      expect(health?.status).toBe('failed');
      expect(health?.error).toContain('Connection failed');
    });
  });
});

describe('Job Logger', () => {
  let jobLogger: JobLogger;

  beforeEach(() => {
    jobLogger = new JobLogger();
  });

  describe('createJob', () => {
    it('should create a new job with running status', () => {
      const jobId = jobLogger.createJob('Test Job', { test: true });
      
      expect(jobId).toBeTruthy();
      expect(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);
    });

    it('should log initial job creation', async () => {
      const jobId = jobLogger.createJob('Test Job');
      const job = await jobLogger.getJob(jobId);
      
      expect(job?.status).toBe('running');
      expect(job?.logs).toHaveLength(1);
      expect(job?.logs[0].level).toBe('INFO');
      expect(job?.logs[0].message).toContain('started');
    });
  });

  describe('log', () => {
    it('should add log entries to a job', async () => {
      const jobId = jobLogger.createJob('Test Job');
      
      jobLogger.log(jobId, 'INFO', 'Processing step 1', 'process');
      jobLogger.log(jobId, 'DEBUG', 'Debug information', 'debug');
      
      const logs = await jobLogger.getJobLogs(jobId);
      
      expect(logs).toHaveLength(3); // Including initial creation log
      expect(logs?.find(l => l.message === 'Processing step 1')).toBeTruthy();
      expect(logs?.find(l => l.level === 'DEBUG')).toBeTruthy();
    });

    it('should include metadata in log entries', async () => {
      const jobId = jobLogger.createJob('Test Job');
      const metadata = { duration: 1234, result: 'success' };
      
      jobLogger.log(jobId, 'INFO', 'Step completed', 'complete', metadata);
      
      const logs = await jobLogger.getJobLogs(jobId);
      const stepLog = logs?.find(l => l.message === 'Step completed');
      
      expect(stepLog?.metadata).toEqual(metadata);
    });
  });

  describe('completeJob', () => {
    it('should mark job as completed and calculate duration', async () => {
      const jobId = jobLogger.createJob('Test Job');
      
      // Wait a small amount to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 10));
      
      jobLogger.completeJob(jobId, 'completed');
      
      const job = await jobLogger.getJob(jobId);
      
      expect(job?.status).toBe('completed');
      expect(job?.completed_at).toBeTruthy();
      expect(job?.duration_ms).toBeGreaterThan(0);
    });

    it('should handle failed job completion', async () => {
      const jobId = jobLogger.createJob('Test Job');
      
      jobLogger.completeJob(jobId, 'failed');
      
      const job = await jobLogger.getJob(jobId);
      expect(job?.status).toBe('failed');
    });
  });

  describe('getRecentJobs', () => {
    it('should return jobs in reverse chronological order', async () => {
      const job1Id = jobLogger.createJob('Job 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const job2Id = jobLogger.createJob('Job 2');
      
      const jobs = await jobLogger.getRecentJobs({ limit: 10 });
      
      expect(jobs).toHaveLength(2);
      expect(jobs[0].id).toBe(job2Id); // Most recent first
      expect(jobs[1].id).toBe(job1Id);
    });

    it('should filter jobs by status', async () => {
      const job1Id = jobLogger.createJob('Job 1');
      const job2Id = jobLogger.createJob('Job 2');
      
      jobLogger.completeJob(job1Id, 'completed');
      jobLogger.completeJob(job2Id, 'failed');
      
      const completedJobs = await jobLogger.getRecentJobs({ status: 'completed' });
      const failedJobs = await jobLogger.getRecentJobs({ status: 'failed' });
      
      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].id).toBe(job1Id);
      expect(failedJobs).toHaveLength(1);
      expect(failedJobs[0].id).toBe(job2Id);
    });

    it('should support pagination', async () => {
      // Create multiple jobs
      for (let i = 0; i < 5; i++) {
        jobLogger.createJob(`Job ${i}`);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const firstPage = await jobLogger.getRecentJobs({ limit: 2, offset: 0 });
      const secondPage = await jobLogger.getRecentJobs({ limit: 2, offset: 2 });
      
      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('getJobStats', () => {
    it('should calculate job statistics correctly', async () => {
      const job1Id = jobLogger.createJob('Job 1');
      const job2Id = jobLogger.createJob('Job 2');
      const job3Id = jobLogger.createJob('Job 3');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      jobLogger.completeJob(job1Id, 'completed');
      jobLogger.completeJob(job2Id, 'failed');
      // job3Id remains running
      
      const stats = await jobLogger.getJobStats();
      
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.running).toBe(1);
      expect(stats.success_rate).toBe(50); // 1 completed out of 2 finished
      expect(stats.avg_duration_ms).toBeGreaterThan(0);
    });
  });
});