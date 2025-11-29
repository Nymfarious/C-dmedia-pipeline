import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimelineStore } from './TimelineStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TransportControlsProps {
  className?: string;
}

export function TransportControls({ className }: TransportControlsProps) {
  const {
    playheadPosition,
    isPlaying,
    isLooping,
    duration,
    togglePlayback,
    setPlayheadPosition,
    setIsLooping,
  } = useTimelineStore();

  const [playbackSpeed, setPlaybackSpeed] = useState('1');

  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "h-12 border-y border-border bg-card/50 flex items-center justify-center gap-4 px-4",
      className
    )}>
      {/* Skip to start */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPlayheadPosition(0)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Go to start (Home)</TooltipContent>
      </Tooltip>

      {/* Play/Pause */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            className="h-10 w-10"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Play/Pause (Space)</TooltipContent>
      </Tooltip>

      {/* Skip to end */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPlayheadPosition(duration)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Go to end (End)</TooltipContent>
      </Tooltip>

      {/* Time display */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="font-mono text-sm text-foreground bg-muted/50 px-2 py-0.5 rounded">
          {formatTime(playheadPosition)}
        </span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Loop toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isLooping ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-8 w-8", isLooping && "text-primary")}
            onClick={() => setIsLooping(!isLooping)}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Loop playback</TooltipContent>
      </Tooltip>

      {/* Speed selector */}
      <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
        <SelectTrigger className="w-16 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">0.5x</SelectItem>
          <SelectItem value="1">1x</SelectItem>
          <SelectItem value="1.5">1.5x</SelectItem>
          <SelectItem value="2">2x</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
