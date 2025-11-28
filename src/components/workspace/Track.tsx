import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, VolumeX, Lock, Unlock, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          isLocked && "opacity-50 pointer-events-none"
        )}
      >
        {/* Empty state */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground/50 select-none">
            Drag assets here
          </span>
        </div>
        
        {/* Clip placeholder slots - visual guides */}
        <div className="absolute inset-0 flex items-center px-1 gap-1 pointer-events-none opacity-30">
          {Array.from({ length: 8 }, (_, i) => (
            <div 
              key={i}
              className="h-8 w-20 rounded border border-dashed border-border/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
