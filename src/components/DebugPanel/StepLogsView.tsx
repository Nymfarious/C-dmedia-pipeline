import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StepLogsView() {
  const logs = [
    { time: '14:32:21', level: 'INFO', message: 'Starting image generation' },
    { time: '14:32:23', level: 'DEBUG', message: 'Prompt: "A beautiful sunset"' },
    { time: '14:32:26', level: 'ERROR', message: 'API rate limit exceeded' }
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground">{log.time}</span>
            <span className={
              log.level === 'ERROR' ? 'text-red-500' : 
              log.level === 'DEBUG' ? 'text-blue-500' : 'text-foreground'
            }>
              {log.level}
            </span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}