import { useState, useRef, useCallback } from 'react';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from './TimelineStore';

interface ClipProps {
  id: string;
  trackType: 'visual' | 'audio' | 'fx';
  startTime: number;
  duration: number;
  label: string;
  isSelected: boolean;
  zoom: number; // pixels per second
  onSelect: () => void;
  onMove: (newStartTime: number) => void;
  onResize: (newStartTime: number, newDuration: number) => void;
  onDelete: () => void;
}

const trackColors = {
  visual: 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30',
  audio: 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30',
  fx: 'bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30',
};

const trackSelectedColors = {
  visual: 'ring-2 ring-blue-500 bg-blue-500/30',
  audio: 'ring-2 ring-green-500 bg-green-500/30',
  fx: 'ring-2 ring-purple-500 bg-purple-500/30',
};

export function Clip({
  id,
  trackType,
  startTime,
  duration,
  label,
  isSelected,
  zoom,
  onSelect,
  onMove,
  onResize,
  onDelete,
}: ClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragStartDuration = useRef(0);
  
  const snapToGrid = useTimelineStore((state) => state.snapToGrid);
  const activeTool = useTimelineStore((state) => state.activeTool);

  const width = duration * zoom;
  const left = startTime * zoom;

  // Handle clip drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'cut') return;
    e.stopPropagation();
    onSelect();
    
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTime.current = startTime;
  }, [onSelect, startTime, activeTool]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / zoom;
      const newStartTime = snapToGrid(Math.max(0, dragStartTime.current + deltaTime));
      onMove(newStartTime);
    } else if (isResizingLeft) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / zoom;
      const newStartTime = snapToGrid(Math.max(0, dragStartTime.current + deltaTime));
      const timeDiff = newStartTime - dragStartTime.current;
      const newDuration = Math.max(0.5, dragStartDuration.current - timeDiff);
      onResize(newStartTime, newDuration);
    } else if (isResizingRight) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaTime = deltaX / zoom;
      const newDuration = snapToGrid(Math.max(0.5, dragStartDuration.current + deltaTime));
      onResize(startTime, newDuration);
    }
  }, [isDragging, isResizingLeft, isResizingRight, zoom, snapToGrid, onMove, onResize, startTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  // Attach global listeners when dragging
  useState(() => {
    if (isDragging || isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Handle left resize
  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsResizingLeft(true);
    dragStartX.current = e.clientX;
    dragStartTime.current = startTime;
    dragStartDuration.current = duration;
  }, [onSelect, startTime, duration]);

  // Handle right resize
  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsResizingRight(true);
    dragStartX.current = e.clientX;
    dragStartDuration.current = duration;
  }, [onSelect, duration]);

  // Render waveform for audio tracks
  const renderWaveform = () => (
    <svg className="absolute inset-0 w-full h-full opacity-50" preserveAspectRatio="none">
      <path
        d="M0,12 Q5,5 10,12 T20,12 T30,12 T40,12 T50,12 T60,12 T70,12 T80,12 T90,12 T100,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-green-400"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 bottom-1 rounded-md border cursor-grab transition-all",
        trackColors[trackType],
        isSelected && trackSelectedColors[trackType],
        (isDragging || isResizingLeft || isResizingRight) && "cursor-grabbing opacity-80 shadow-lg",
        activeTool === 'cut' && "cursor-crosshair"
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left resize handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group",
          "hover:bg-white/20 transition-colors"
        )}
        onMouseDown={handleLeftResizeStart}
      >
        <div className={cn(
          "absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/40 rounded-full",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )} />
      </div>

      {/* Clip content */}
      <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
        {trackType === 'audio' && renderWaveform()}
        <span className="text-xs font-medium text-foreground truncate z-10 drop-shadow-sm">
          {label}
        </span>
      </div>

      {/* Right resize handle */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize group",
          "hover:bg-white/20 transition-colors"
        )}
        onMouseDown={handleRightResizeStart}
      >
        <div className={cn(
          "absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/40 rounded-full",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )} />
      </div>

      {/* Delete button */}
      {(isSelected || isHovered) && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform z-20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
