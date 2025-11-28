import { Film, Image, Music, Sparkles } from 'lucide-react';
import { useTimelineStore, Clip } from './TimelineStore';
import { cn } from '@/lib/utils';

export function PreviewCanvas() {
  const { clips, selectedClipId, playheadPosition } = useTimelineStore();
  
  // Find selected clip or clip under playhead
  const selectedClip = selectedClipId 
    ? clips.find(c => c.id === selectedClipId)
    : clips.find(c => 
        playheadPosition >= c.startTime && 
        playheadPosition < c.startTime + c.duration
      );

  const getTrackIcon = (trackType: Clip['trackType']) => {
    switch (trackType) {
      case 'visual': return Image;
      case 'audio': return Music;
      case 'fx': return Sparkles;
    }
  };

  const getTrackColor = (trackType: Clip['trackType']) => {
    switch (trackType) {
      case 'visual': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'audio': return 'from-green-500/20 to-green-600/10 border-green-500/30';
      case 'fx': return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
    }
  };

  if (!selectedClip) {
    return (
      <div className="h-full bg-muted/10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-border/50 flex items-center justify-center">
            <Film className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground font-medium">Preview Canvas</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Select a clip or add clips to the timeline
            </p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = getTrackIcon(selectedClip.trackType);
  const colorClass = getTrackColor(selectedClip.trackType);

  return (
    <div className="h-full bg-muted/10 flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl aspect-video">
        {/* Preview frame */}
        <div className={cn(
          "w-full h-full rounded-xl bg-gradient-to-br border-2 flex items-center justify-center",
          colorClass
        )}>
          {selectedClip.thumbnail ? (
            <img 
              src={selectedClip.thumbnail} 
              alt={selectedClip.label}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-xl bg-background/50 flex items-center justify-center">
                <Icon className="h-8 w-8 text-foreground/60" />
              </div>
              <div>
                <p className="text-foreground font-medium">{selectedClip.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedClip.trackType} • {selectedClip.duration.toFixed(1)}s
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Clip info overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{selectedClip.label}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Start: {selectedClip.startTime.toFixed(1)}s</span>
            <span>Duration: {selectedClip.duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Playhead position indicator */}
        {playheadPosition >= selectedClip.startTime && playheadPosition < selectedClip.startTime + selectedClip.duration && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded font-mono">
            {((playheadPosition - selectedClip.startTime) / selectedClip.duration * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
