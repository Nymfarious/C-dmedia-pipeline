import { WorkspaceHeader } from './WorkspaceHeader';

export function TimelineWorkspace() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar with Navigation */}
      <WorkspaceHeader />
      
      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Canvas (top) - placeholder for now */}
        <div className="flex-1 bg-muted/20 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <p className="text-muted-foreground">Preview Canvas — Coming Soon</p>
            <p className="text-xs text-muted-foreground/60">Phase 2 will add the timeline rail below</p>
          </div>
        </div>
        
        {/* Timeline Rail (bottom) - placeholder for now */}
        <div className="h-48 border-t border-border bg-card flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 rounded bg-purple-500/30 animate-pulse" />
              <div className="w-12 h-8 rounded bg-cyan-500/30 animate-pulse delay-100" />
              <div className="w-10 h-8 rounded bg-purple-500/30 animate-pulse delay-200" />
              <div className="w-14 h-8 rounded bg-cyan-500/30 animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-sm">Timeline Rail — Coming Soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
