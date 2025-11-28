import { WorkspaceHeader } from './WorkspaceHeader';
import { TimelineRail } from './TimelineRail';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { Film } from 'lucide-react';

export function TimelineWorkspace() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar with Navigation */}
      <WorkspaceHeader />
      
      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="flex-1">
          {/* Preview Canvas (top) */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="h-full bg-muted/10 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-border/50 flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Preview Canvas</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Video preview will render here
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Timeline Rail (bottom) */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <TimelineRail />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
