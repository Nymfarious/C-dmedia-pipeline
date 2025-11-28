import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function WorkspaceHeader() {
  const navigate = useNavigate();

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
      {/* Mode Ferry - Left side */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Switch to Main Canvas</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="h-4 w-px bg-border" />
        
        <h1 className="text-sm font-medium text-foreground">
          CORE Timeline
        </h1>
      </div>

      {/* Center - Title area (can expand later) */}
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-muted-foreground/60 px-3 py-1 rounded-full bg-muted/30">
          Phase 1 — Shell
        </span>
      </div>

      {/* Right side - Future toolbar items */}
      <div className="flex items-center gap-2">
        {/* Placeholder for future controls like play/pause, zoom, etc. */}
      </div>
    </header>
  );
}
