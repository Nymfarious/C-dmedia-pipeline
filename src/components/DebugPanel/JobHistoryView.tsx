import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function JobHistoryView() {
  const jobs = [
    { id: '1', name: 'Image Generation', status: 'completed', duration: 2300 },
    { id: '2', name: 'Face Enhancement', status: 'running', duration: null },
    { id: '3', name: 'Background Removal', status: 'failed', duration: 1200 }
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="p-3 border rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{job.name}</span>
              <Badge variant={
                job.status === 'completed' ? 'default' : 
                job.status === 'running' ? 'secondary' : 'destructive'
              }>
                {job.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {job.duration ? `${job.duration}ms` : 'Running...'}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}