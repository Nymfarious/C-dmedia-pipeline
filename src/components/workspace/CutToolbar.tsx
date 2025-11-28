import { Scissors, Crop, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface CutToolbarProps {
  position: { x: number; y: number };
  onCutInside: (allTracks: boolean) => void;
  onCutOutside: (allTracks: boolean) => void;
  onClear: () => void;
  selectionDuration: number;
}

export function CutToolbar({ 
  position, 
  onCutInside, 
  onCutOutside, 
  onClear,
  selectionDuration 
}: CutToolbarProps) {
  const [allTracks, setAllTracks] = useState(true);

  return (
    <div 
      className="absolute bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col gap-2 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)'
      }}
    >
      {/* Track selection toggle */}
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-border">
        <Layers className="h-3 w-3 text-muted-foreground" />
        <Label htmlFor="all-tracks" className="text-xs text-muted-foreground">All tracks</Label>
        <Switch
          id="all-tracks"
          checked={allTracks}
          onCheckedChange={setAllTracks}
          className="scale-75"
        />
      </div>

      {/* Cut actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs gap-1"
              onClick={() => onCutInside(allTracks)}
            >
              <Scissors className="w-3.5 h-3.5" />
              Cut Inside
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Remove selection and close gap (ripple delete)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs gap-1"
              onClick={() => onCutOutside(allTracks)}
            >
              <Crop className="w-3.5 h-3.5" />
              Cut Outside
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Keep only the selection, remove everything else
          </TooltipContent>
        </Tooltip>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Duration info */}
      <div className="text-[10px] text-muted-foreground text-center">
        {selectionDuration.toFixed(2)}s selected
      </div>
    </div>
  );
}
