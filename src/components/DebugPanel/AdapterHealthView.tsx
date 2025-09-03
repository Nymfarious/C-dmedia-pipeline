import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AdapterHealthView() {
  const adapters = [
    { name: 'Replicate FLUX', status: 'healthy', latency: 234 },
    { name: 'OpenAI DALL-E', status: 'healthy', latency: 456 },
    { name: 'Gemini Nano', status: 'degraded', latency: 1200 },
    { name: 'Seed Edit', status: 'failed', latency: 0 }
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {adapters.map((adapter, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">{adapter.name}</CardTitle>
                <Badge variant={
                  adapter.status === 'healthy' ? 'default' : 
                  adapter.status === 'degraded' ? 'secondary' : 'destructive'
                }>
                  {adapter.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Latency: {adapter.latency}ms
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}