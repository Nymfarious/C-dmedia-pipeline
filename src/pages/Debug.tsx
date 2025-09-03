import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Clock, AlertTriangle } from 'lucide-react';

interface AdapterHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  latency_ms: number;
  last_check: string;
  error?: string;
}

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

interface JobLog {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  step?: string;
}

export function Debug() {
  const [adapters, setAdapters] = useState<AdapterHealth[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealthData();
    fetchJobs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
      fetchJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/adapters');
      if (response.ok) {
        const data = await response.json();
        setAdapters(data.adapters || []);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs/recent?limit=20');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobLogs = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setJobLogs(data.logs || []);
        setSelectedJob(jobId);
      }
    } catch (error) {
      console.error('Failed to fetch job logs:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchHealthData();
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'default';
      case 'degraded':
      case 'running':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-destructive';
      case 'WARN':
        return 'text-yellow-500';
      case 'INFO':
        return 'text-primary';
      case 'DEBUG':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Panel</h1>
          <p className="text-muted-foreground">
            System health and job monitoring for Frame Fuser
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Adapter Health
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Clock className="h-4 w-4 mr-2" />
            Recent Jobs
          </TabsTrigger>
          <TabsTrigger value="logs">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Job Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adapters.map((adapter) => (
              <Card key={adapter.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{adapter.name}</CardTitle>
                    <Badge variant={getStatusColor(adapter.status)}>
                      {adapter.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latency:</span>
                      <span>{adapter.latency_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last check:</span>
                      <span>{new Date(adapter.last_check).toLocaleTimeString()}</span>
                    </div>
                    {adapter.error && (
                      <div className="text-destructive text-xs">
                        Error: {adapter.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Job History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fetchJobLogs(job.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.name}</span>
                          <Badge variant={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {new Date(job.started_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {job.duration_ms && (
                          <div className="text-muted-foreground">
                            {job.duration_ms}ms
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {job.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>
                Job Logs
                {selectedJob && (
                  <span className="text-muted-foreground ml-2">
                    ({selectedJob.slice(-8)})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedJob ? (
                <ScrollArea className="h-96">
                  <div className="space-y-1 font-mono text-sm">
                    {jobLogs.map((log) => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs font-bold ${getLogLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                        {log.step && (
                          <span className="text-xs text-blue-500">
                            [{log.step}]
                          </span>
                        )}
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Select a job from the Recent Jobs tab to view its logs
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}