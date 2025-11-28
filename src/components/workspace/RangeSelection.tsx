import { cn } from '@/lib/utils';

interface RangeSelectionProps {
  startTime: number;
  endTime: number;
  zoom: number;
  labelWidth?: number;
  className?: string;
}

export function RangeSelection({ 
  startTime, 
  endTime, 
  zoom, 
  labelWidth = 96,
  className 
}: RangeSelectionProps) {
  const left = labelWidth + (startTime * zoom);
  const width = (endTime - startTime) * zoom;
  const duration = endTime - startTime;

  const formatDuration = (seconds: number) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 pointer-events-none z-30",
        className
      )}
      style={{ left, width: Math.max(width, 2) }}
    >
      {/* Selection overlay */}
      <div className="absolute inset-0 bg-yellow-500/20 border-l-2 border-r-2 border-yellow-500/60" />
      
      {/* Duration label */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
        {formatDuration(duration)} selected
      </div>
      
      {/* Edge handles */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 cursor-ew-resize pointer-events-auto" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-500 cursor-ew-resize pointer-events-auto" />
    </div>
  );
}
