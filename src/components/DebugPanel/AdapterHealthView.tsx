import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { healthCheck } from '@/lib/apiClient';

export function AdapterHealthView() {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsLoading(true);
      const result = await healthCheck();
      setHealthData(result);
      setIsLoading(false);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const adapters = [
    { name: 'API Health', status: healthData?.ok ? 'healthy' : 'failed', latency: healthData?.timestamp ? Date.now() - healthData.timestamp : 0 },
    { name: 'Replicate FLUX', status: 'healthy', latency: 234 },
    { name: 'OpenAI DALL-E', status: 'healthy', latency: 456 },
    { name: 'Gemini Nano', status: 'degraded', latency: 1200 },
    { name: 'Seed Edit', status: 'failed', latency: 0 }
  ];

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Checking health...
      </div>
    );
  }

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