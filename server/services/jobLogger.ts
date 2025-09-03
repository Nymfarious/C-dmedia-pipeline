export interface JobLog {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  step?: string;
  metadata?: Record<string, any>;
}

export interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  logs: JobLog[];
}

export interface JobStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  avg_duration_ms: number;
  success_rate: number;
}

export class JobLogger {
  private jobs = new Map<string, Job>();
  private maxJobs = 1000; // Keep last 1000 jobs in memory

  constructor() {
    // Add some sample jobs for testing
    this.createSampleJobs();
  }

  private createSampleJobs() {
    // Sample job 1 - Completed
    const job1Id = this.createJob('Image Generation', { model: 'flux-pro', prompt: 'A beautiful sunset' });
    this.log(job1Id, 'INFO', 'Starting image generation', 'initialization');
    this.log(job1Id, 'DEBUG', 'Using model: flux-pro', 'setup');
    this.log(job1Id, 'INFO', 'Sending request to Replicate', 'api-call');
    this.log(job1Id, 'INFO', 'Image generated successfully', 'completion');
    this.completeJob(job1Id, 'completed');

    // Sample job 2 - Failed
    const job2Id = this.createJob('Background Removal', { image: 'portrait.jpg' });
    this.log(job2Id, 'INFO', 'Starting background removal', 'initialization');
    this.log(job2Id, 'ERROR', 'API rate limit exceeded', 'api-call');
    this.completeJob(job2Id, 'failed');

    // Sample job 3 - Running
    const job3Id = this.createJob('Video Generation', { duration: 5, fps: 24 });
    this.log(job3Id, 'INFO', 'Starting video generation', 'initialization');
    this.log(job3Id, 'DEBUG', 'Processing frame 1/120', 'processing');
    // Leave this one running
  }

  createJob(name: string, metadata?: Record<string, any>): string {
    const id = this.generateJobId();
    const job: Job = {
      id,
      name,
      status: 'running',
      started_at: new Date().toISOString(),
      metadata,
      logs: []
    };
    
    this.jobs.set(id, job);
    this.cleanupOldJobs();
    
    this.log(id, 'INFO', `Job '${name}' started`, 'init');
    
    return id;
  }

  log(jobId: string, level: JobLog['level'], message: string, step?: string, metadata?: Record<string, any>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const logEntry: JobLog = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      step,
      metadata
    };

    job.logs.push(logEntry);
    
    // Also log to console for server logs
    console.log(`[${level}] Job ${jobId} (${step || 'unknown'}): ${message}`, metadata || '');
  }

  completeJob(jobId: string, status: 'completed' | 'failed' | 'cancelled' = 'completed'): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt).getTime() - new Date(job.started_at).getTime();

    job.status = status;
    job.completed_at = completedAt;
    job.duration_ms = duration;

    this.log(jobId, status === 'completed' ? 'INFO' : 'ERROR', 
             `Job completed with status: ${status}`, 'complete', 
             { duration_ms: duration });
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobLogs(jobId: string): Promise<JobLog[] | null> {
    const job = this.jobs.get(jobId);
    return job ? job.logs : null;
  }

  async getRecentJobs(options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<Job[]> {
    const { limit = 50, offset = 0, status } = options;
    
    let jobs = Array.from(this.jobs.values());
    
    // Filter by status if provided
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    // Sort by started_at descending (most recent first)
    jobs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    
    // Apply pagination
    return jobs.slice(offset, offset + limit);
  }

  async getJobStats(): Promise<JobStats> {
    const jobs = Array.from(this.jobs.values());
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    const running = jobs.filter(j => j.status === 'running').length;
    
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.duration_ms);
    const avgDuration = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + (job.duration_ms || 0), 0) / completedJobs.length
      : 0;
    
    const successRate = total > 0 ? (completed / (completed + failed)) * 100 : 0;

    return {
      total,
      completed,
      failed,
      running,
      avg_duration_ms: Math.round(avgDuration),
      success_rate: Math.round(successRate * 100) / 100
    };
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private cleanupOldJobs(): void {
    if (this.jobs.size <= this.maxJobs) return;

    const jobs = Array.from(this.jobs.entries());
    jobs.sort(([, a], [, b]) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    
    const toDelete = jobs.slice(0, jobs.length - this.maxJobs);
    toDelete.forEach(([id]) => this.jobs.delete(id));
  }
}