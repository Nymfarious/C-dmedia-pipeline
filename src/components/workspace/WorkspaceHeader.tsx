import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function WorkspaceHeader() {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
      {/* Left side - space for ModeFerry button + title */}
      <div className="flex items-center gap-3">
        {/* ModeFerry renders here via fixed positioning */}
        <div className="w-10" /> {/* Spacer for the ferry button */}
        
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
