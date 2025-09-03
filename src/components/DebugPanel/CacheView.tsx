import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CacheView() {
  const cacheItems = [
    { key: 'flux-generate-abc123', size: '2.1MB', hits: 3 },
    { key: 'openai-edit-def456', size: '1.8MB', hits: 1 },
    { key: 'seed-upscale-ghi789', size: '4.2MB', hits: 7 }
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {cacheItems.map((item, i) => (
          <div key={i} className="p-2 border rounded text-xs">
            <div className="font-mono text-xs">{item.key}</div>
            <div className="text-muted-foreground mt-1">
              {item.size} • {item.hits} hits
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}