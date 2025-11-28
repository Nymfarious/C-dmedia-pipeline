import { useState, useRef, useCallback } from 'react';
import { Image, Music, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { Playhead } from './Playhead';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [mobileLayout, setMobileLayout] = useState<'right' | 'left' | 'horizontal'>('right');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Sync scroll across all tracks if needed
  }, []);

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
        "h-48 border-t border-border bg-card flex flex-col relative",
        className
      )}
    >
      {/* Time Ruler */}
      <TimeRuler pixelsPerSecond={20} duration={120} />

      {/* Tracks Container with synchronized scroll */}
      <div 
        className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative"
        onScroll={handleScroll}
      >
        {/* Playhead */}
        <Playhead 
          position={playheadPosition}
          onPositionChange={setPlayheadPosition}
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
