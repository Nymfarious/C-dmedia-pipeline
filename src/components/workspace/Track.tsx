import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, Lock, Unlock, LucideIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from './TimelineStore';
import { Clip } from './Clip';

interface TrackProps {
  id: string;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  isMobile?: boolean;
  className?: string;
}

export function Track({ 
  id, 
  label, 
  icon: Icon, 
  colorClass,
  isMobile = false,
  className 
}: TrackProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { 
    clips, 
    selectedClipId, 
    zoom, 
    playheadPosition,
    activeTool,
    addClip, 
    removeClip, 
    updateClip, 
    setSelectedClip,
    mendClips 
  } = useTimelineStore();

  const trackType = id as 'visual' | 'audio' | 'fx';
  const trackClips = clips.filter(c => c.trackType === trackType);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setIsDragOver(true);
  }, [isLocked]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLocked) return;

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const asset = JSON.parse(data);
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left - 96; // Subtract label width
      const startTime = Math.max(0, dropX / zoom);

      addClip({
        trackType,
        startTime: useTimelineStore.getState().snapToGrid(startTime),
        duration: asset.duration || 5,
        label: asset.name || `${label} Clip`,
        assetId: asset.id,
        thumbnail: asset.url || asset.thumbnail,
      });
    } catch (err) {
      console.error('Failed to parse dropped asset:', err);
    }
  }, [isLocked, zoom, trackType, label, addClip]);

  // Add test clip at playhead position
  const handleAddTestClip = useCallback(() => {
    addClip({
      trackType,
      startTime: useTimelineStore.getState().snapToGrid(playheadPosition),
      duration: 5,
      label: `${label} Clip ${trackClips.length + 1}`,
    });
  }, [trackType, label, playheadPosition, trackClips.length, addClip]);

  // Handle mend tool click
  const [pendingMendClip, setPendingMendClip] = useState<string | null>(null);
  
  const handleClipSelect = useCallback((clipId: string) => {
    if (activeTool === 'mend') {
      if (pendingMendClip && pendingMendClip !== clipId) {
        mendClips(pendingMendClip, clipId);
        setPendingMendClip(null);
      } else {
        setPendingMendClip(clipId);
        setSelectedClip(clipId);
      }
    } else {
      setSelectedClip(clipId);
    }
  }, [activeTool, pendingMendClip, mendClips, setSelectedClip]);

  return (
    <div 
      className={cn(
        "flex border-b border-border/50 last:border-b-0",
        isMobile ? "flex-col h-auto min-h-[80px]" : "flex-row h-12",
        className
      )}
    >
      {/* Track Label Area */}
      <div className={cn(
        "flex items-center gap-1 px-2 border-r border-border bg-card/50",
        isMobile ? "w-full h-8 border-r-0 border-b" : "w-24 flex-shrink-0"
      )}>
        <div className={cn(
          "w-4 h-4 rounded flex items-center justify-center flex-shrink-0",
          colorClass
        )}>
          <Icon className="h-2.5 w-2.5" />
        </div>
        <span className="text-[10px] font-medium text-foreground">{label}</span>
        
        {/* Track Controls */}
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={handleAddTestClip}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Add test clip
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0",
                  isMuted && "text-destructive"
                )}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isMuted ? 'Unmute' : 'Mute'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0",
                  isLocked && "text-amber-500"
                )}
                onClick={() => setIsLocked(!isLocked)}
              >
                {isLocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isLocked ? 'Unlock' : 'Lock'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Track Content Area */}
      <div 
        className={cn(
          "flex-1 relative",
          colorClass.replace('text-', 'bg-').replace('500', '500/5'),
          isLocked && "opacity-50 pointer-events-none",
          isDragOver && "ring-2 ring-primary ring-inset bg-primary/10"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Empty state */}
        {trackClips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-border/30 m-1 rounded">
            <span className="text-xs text-muted-foreground/50 select-none">
              Drag assets here
            </span>
          </div>
        )}
        
        {/* Clips */}
        {trackClips.map((clip) => (
          <Clip
            key={clip.id}
            {...clip}
            isSelected={selectedClipId === clip.id}
            zoom={zoom}
            onSelect={() => handleClipSelect(clip.id)}
            onMove={(newStartTime) => updateClip(clip.id, { startTime: newStartTime })}
            onResize={(newStartTime, newDuration) => 
              updateClip(clip.id, { startTime: newStartTime, duration: newDuration })
            }
            onDelete={() => removeClip(clip.id)}
          />
        ))}
      </div>
    </div>
  );
}
