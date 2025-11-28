import { useState, useRef, useCallback } from 'react';
import { Image, Music, Sparkles, Settings, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { Playhead } from './Playhead';
import { PlaybackControls } from './PlaybackControls';
import { RangeSelection } from './RangeSelection';
import { CutToolbar } from './CutToolbar';
import { MendingOverlay } from './MendingOverlay';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimelineStore } from './TimelineStore';
import { cn } from '@/lib/utils';

interface TimelineRailProps {
  className?: string;
}

const tracks = [
  { id: 'visual', label: 'Visual', icon: Image, colorClass: 'bg-blue-500/20 text-blue-400' },
  { id: 'audio', label: 'Audio', icon: Music, colorClass: 'bg-green-500/20 text-green-400' },
  { id: 'fx', label: 'FX', icon: Sparkles, colorClass: 'bg-purple-500/20 text-purple-400' },
];

export function TimelineRail({ className }: TimelineRailProps) {
  const isMobile = useIsMobile();
  const [mobileLayout, setMobileLayout] = useState<'right' | 'left' | 'horizontal'>('right');
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [rangeStartX, setRangeStartX] = useState(0);
  
  const { 
    playheadPosition, 
    setPlayheadPosition, 
    zoom, 
    setZoom,
    duration,
    rangeSelection,
    setRangeSelection,
    cutInside,
    cutOutside,
    showMendingAt,
    clearMendingAnimation,
  } = useTimelineStore();

  // Convert playhead position from seconds to pixels
  const playheadPixels = playheadPosition * zoom;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Sync scroll across all tracks if needed
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -2 : 2;
      setZoom(zoom + delta);
    }
  }, [zoom, setZoom]);

  // Range selection on ruler
  const handleRulerMouseDown = useCallback((e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 96; // Subtract label width
    const time = Math.max(0, x / zoom);
    
    setIsSelectingRange(true);
    setRangeStartX(time);
    setRangeSelection({ startTime: time, endTime: time });
  }, [zoom, setRangeSelection]);

  const handleRulerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelectingRange || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 96;
    const time = Math.max(0, x / zoom);
    
    const startTime = Math.min(rangeStartX, time);
    const endTime = Math.max(rangeStartX, time);
    setRangeSelection({ startTime, endTime });
  }, [isSelectingRange, rangeStartX, zoom, setRangeSelection]);

  const handleRulerMouseUp = useCallback(() => {
    setIsSelectingRange(false);
    // Clear selection if it's too small
    if (rangeSelection && rangeSelection.endTime - rangeSelection.startTime < 0.1) {
      setRangeSelection(null);
    }
  }, [rangeSelection, setRangeSelection]);

  // Calculate toolbar position
  const getToolbarPosition = useCallback(() => {
    if (!rangeSelection) return { x: 0, y: 0 };
    const midTime = (rangeSelection.startTime + rangeSelection.endTime) / 2;
    return {
      x: 96 + midTime * zoom,
      y: 24, // Just below the ruler
    };
  }, [rangeSelection, zoom]);

  // Mobile vertical layout
  if (isMobile && mobileLayout !== 'horizontal') {
    return (
      <div 
        className={cn(
          "fixed top-0 bottom-0 w-24 bg-card border-border flex flex-col z-30",
          mobileLayout === 'right' ? "right-0 border-l" : "left-0 border-r",
          className
        )}
      >
        {/* Mobile Settings Toggle */}
        <div className="h-10 border-b border-border flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">Timeline</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMobileLayout('left')}>
                Flip to Left Side
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMobileLayout('right')}>
                Flip to Right Side
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMobileLayout('horizontal')}>
                Force Horizontal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vertical tracks */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {tracks.map((track) => (
            <Track
              key={track.id}
              {...track}
              isMobile={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop horizontal layout
  return (
    <div 
      ref={containerRef}
      className={cn(
        "border-t border-border bg-card flex flex-col relative",
        className
      )}
      onWheel={handleWheel}
    >
      {/* Playback Controls */}
      <PlaybackControls />

      {/* Time Ruler with range selection */}
      <div 
        ref={rulerRef}
        className="relative cursor-crosshair"
        onMouseDown={handleRulerMouseDown}
        onMouseMove={handleRulerMouseMove}
        onMouseUp={handleRulerMouseUp}
        onMouseLeave={handleRulerMouseUp}
      >
        <TimeRuler pixelsPerSecond={zoom} duration={duration} />
      </div>

      {/* Tracks Container with synchronized scroll */}
      <div 
        className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative"
        onScroll={handleScroll}
      >
        {/* Range Selection Overlay */}
        {rangeSelection && (
          <RangeSelection
            startTime={rangeSelection.startTime}
            endTime={rangeSelection.endTime}
            zoom={zoom}
          />
        )}

        {/* Cut Toolbar */}
        {rangeSelection && !isSelectingRange && rangeSelection.endTime - rangeSelection.startTime > 0.1 && (
          <CutToolbar
            position={getToolbarPosition()}
            onCutInside={cutInside}
            onCutOutside={cutOutside}
            onClear={() => setRangeSelection(null)}
            selectionDuration={rangeSelection.endTime - rangeSelection.startTime}
          />
        )}

        {/* Mending Animation */}
        {showMendingAt !== null && (
          <MendingOverlay
            position={showMendingAt}
            onComplete={clearMendingAnimation}
          />
        )}

        {/* Playhead */}
        <Playhead 
          position={playheadPixels}
          onPositionChange={(px) => setPlayheadPosition(px / zoom)}
          trackHeight={144}
        />

        {/* Tracks */}
        {tracks.map((track) => (
          <Track
            key={track.id}
            {...track}
            isMobile={false}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setZoom(zoom - 5)}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>
        
        <Slider
          value={[zoom]}
          onValueChange={([v]) => setZoom(v)}
          min={5}
          max={100}
          step={5}
          className="w-20"
        />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setZoom(zoom + 5)}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom in (Ctrl+Scroll)</TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile layout toggle (visible on smaller screens that aren't mobile) */}
      {isMobile && mobileLayout === 'horizontal' && (
        <div className="absolute top-1 right-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setMobileLayout('right')}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch to vertical layout</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
