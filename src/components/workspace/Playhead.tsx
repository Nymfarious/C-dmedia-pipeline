import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PlayheadProps {
  position: number; // in pixels
  onPositionChange: (position: number) => void;
  maxPosition?: number;
  trackHeight?: number;
  className?: string;
}

export function Playhead({ 
  position, 
  onPositionChange, 
  maxPosition = 2400,
  trackHeight = 144, // 3 tracks * 48px
  className 
}: PlayheadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = playheadRef.current?.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const labelWidth = 96; // w-24 = 6rem = 96px
    const newPosition = Math.max(0, Math.min(e.clientX - rect.left - labelWidth, maxPosition));
    onPositionChange(newPosition);
  }, [isDragging, maxPosition, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={playheadRef}
      className={cn(
        "absolute top-0 z-20 cursor-ew-resize group",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{ 
        left: `calc(6rem + ${position}px)`, // 6rem = label area width
        height: `calc(${trackHeight}px + 24px)` // tracks + ruler
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Playhead handle */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full shadow-lg ring-2 ring-background group-hover:scale-110 transition-transform" />
      
      {/* Playhead line */}
      <div className="w-0.5 h-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
      
      {/* Time tooltip on drag */}
      {isDragging && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded font-mono whitespace-nowrap">
          {Math.floor(position / 100)}:{String(Math.floor((position % 100) * 0.6)).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
