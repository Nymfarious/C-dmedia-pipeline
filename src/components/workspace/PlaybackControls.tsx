import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Scissors, Link, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTimelineStore } from './TimelineStore';

export function PlaybackControls() {
  const {
    playheadPosition,
    isPlaying,
    isLooping,
    duration,
    activeTool,
    snapInterval,
    historyIndex,
    history,
    togglePlayback,
    setPlayheadPosition,
    setIsLooping,
    setActiveTool,
    setSnapInterval,
    cutClipAtPlayhead,
    undo,
    redo,
  } = useTimelineStore();

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Playback animation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      
      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - lastTimeRef.current) / 1000;
        lastTimeRef.current = currentTime;
        
        setPlayheadPosition(playheadPosition + deltaTime);
        
        // Check if we've reached the end
        if (playheadPosition >= duration) {
          if (isLooping) {
            setPlayheadPosition(0);
          } else {
            togglePlayback();
            return;
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, isLooping, duration, playheadPosition, setPlayheadPosition, togglePlayback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          if (activeTool === 'cut') {
            cutClipAtPlayhead();
          } else {
            setActiveTool('cut');
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setActiveTool(activeTool === 'mend' ? 'select' : 'mend');
          break;
        case 'Escape':
          setActiveTool('select');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlayheadPosition(Math.max(0, playheadPosition - (e.shiftKey ? 5 : 1)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPlayheadPosition(Math.min(duration, playheadPosition + (e.shiftKey ? 5 : 1)));
          break;
        case 'Home':
          e.preventDefault();
          setPlayheadPosition(0);
          break;
        case 'End':
          e.preventDefault();
          setPlayheadPosition(duration);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, playheadPosition, duration, togglePlayback, setActiveTool, setPlayheadPosition, cutClipAtPlayhead, undo, redo]);

  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="h-10 border-b border-border bg-card/50 flex items-center justify-between px-3">
      {/* Left: Transport controls */}
      <div className="flex items-center gap-1">
        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={undo}
              disabled={historyIndex < 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={redo}
              disabled={historyIndex >= history.length - 2}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPlayheadPosition(0)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to start (Home)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPlaying ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Play/Pause (Space)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPlayheadPosition(duration)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to end (End)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isLooping ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 w-7 p-0", isLooping && "text-primary")}
              onClick={() => setIsLooping(!isLooping)}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Loop playback</TooltipContent>
        </Tooltip>
      </div>

      {/* Center: Time display */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-foreground bg-muted/50 px-2 py-0.5 rounded">
          {formatTime(playheadPosition)}
        </span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Right: Edit tools & Snap */}
      <div className="flex items-center gap-2">
        {/* Cut tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'cut' ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 w-7 p-0", activeTool === 'cut' && "text-destructive")}
              onClick={() => setActiveTool(activeTool === 'cut' ? 'select' : 'cut')}
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut tool (C)</TooltipContent>
        </Tooltip>

        {/* Mend tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'mend' ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-7 w-7 p-0", activeTool === 'mend' && "text-green-500")}
              onClick={() => setActiveTool(activeTool === 'mend' ? 'select' : 'mend')}
            >
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mend tool (M) - Join adjacent clips</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Snap interval */}
        <Select
          value={String(snapInterval)}
          onValueChange={(v) => setSnapInterval(Number(v))}
        >
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No snap</SelectItem>
            <SelectItem value="0.5">0.5s</SelectItem>
            <SelectItem value="1">1s</SelectItem>
            <SelectItem value="5">5s</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
