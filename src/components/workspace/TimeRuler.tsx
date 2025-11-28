import { cn } from '@/lib/utils';

interface TimeRulerProps {
  pixelsPerSecond?: number;
  duration?: number; // in seconds
  className?: string;
}

export function TimeRuler({ 
  pixelsPerSecond = 20, 
  duration = 120, // 2 minutes default
  className 
}: TimeRulerProps) {
  // Generate markers every 5 seconds
  const markerInterval = 5;
  const markerCount = Math.ceil(duration / markerInterval) + 1;
  const markerWidth = pixelsPerSecond * markerInterval;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={cn("h-6 border-b border-border flex items-end", className)}>
      {/* Fixed label area spacer */}
      <div className="w-24 flex-shrink-0 border-r border-border bg-card/50" />
      
      {/* Scrollable time markers */}
      <div className="flex-1 flex overflow-hidden">
        {Array.from({ length: markerCount }, (_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 border-l border-border/30 relative"
            style={{ width: markerWidth }}
          >
            <span className="absolute bottom-1 left-1 text-[10px] text-muted-foreground font-mono">
              {formatTime(i * markerInterval)}
            </span>
            {/* Sub-tick marks */}
            <div className="absolute bottom-0 left-1/2 w-px h-2 bg-border/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
