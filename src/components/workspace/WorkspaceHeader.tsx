import { ModeNavigation } from '@/components/ModeNavigation';

export function WorkspaceHeader() {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
      {/* Left side - title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-foreground">
          CORE Timeline
        </h1>
      </div>

      {/* Center - Mode Navigation */}
      <ModeNavigation />

      {/* Right side - Phase indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/60 px-3 py-1 rounded-full bg-muted/30">
          Phase 1 — Shell
        </span>
      </div>
    </header>
  );
}
