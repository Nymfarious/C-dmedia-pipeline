import { useState, useRef, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from './TimelineStore';
import { StaticWaveform } from './AudioWaveform';

interface ClipProps {
  id: string;
  trackType: 'visual' | 'audio' | 'fx';
  startTime: number;
  duration: number;
  label: string;
  thumbnail?: string;
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
  thumbnail,
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
  const { playheadPosition, isPlaying } = useTimelineStore();

  const width = duration * zoom;
  const left = startTime * zoom;

  // Calculate playhead progress within this clip
  const playheadProgress = useMemo(() => {
    if (playheadPosition < startTime) return 0;
    if (playheadPosition > startTime + duration) return 1;
    return (playheadPosition - startTime) / duration;
  }, [playheadPosition, startTime, duration]);

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

  // Render content based on track type
  const renderContent = () => {
    if (trackType === 'audio') {
      return (
        <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
          {/* Audio waveform visualization */}
          <div className="absolute inset-0 opacity-60">
            <StaticWaveform width={Math.max(20, width - 16)} height={28} />
          </div>
          {/* Progress overlay showing played portion */}
          <div 
            className="absolute inset-y-0 left-0 bg-green-500/20 pointer-events-none transition-all duration-100"
            style={{ width: `${playheadProgress * 100}%` }}
          />
          <span className="text-xs font-medium text-foreground truncate z-10 drop-shadow-sm relative">
            {label}
          </span>
        </div>
      );
    }

    if (trackType === 'visual' && thumbnail) {
      return (
        <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <img src={thumbnail} alt={label} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-medium text-foreground truncate z-10 drop-shadow-sm relative">
            {label}
          </span>
        </div>
      );
    }

    // FX track or visual without thumbnail
    if (trackType === 'fx') {
      return (
        <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
          {/* FX sparkle pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="h-full flex items-center gap-1">
              {Array.from({ length: Math.floor(width / 10) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-purple-400"
                  style={{ 
                    opacity: Math.sin(i * 0.5) * 0.5 + 0.5,
                    transform: `scale(${Math.sin(i * 0.3) * 0.5 + 1})`
                  }}
                />
              ))}
            </div>
          </div>
          <span className="text-xs font-medium text-foreground truncate z-10 drop-shadow-sm">
            {label}
          </span>
        </div>
      );
    }

    // Default content
    return (
      <div className="absolute inset-x-2 inset-y-0 flex items-center overflow-hidden">
        <span className="text-xs font-medium text-foreground truncate z-10 drop-shadow-sm">
          {label}
        </span>
      </div>
    );
  };

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
      {renderContent()}

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
