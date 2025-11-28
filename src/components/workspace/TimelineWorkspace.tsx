import { WorkspaceHeader } from './WorkspaceHeader';
import { TimelineRail } from './TimelineRail';
import { PreviewCanvas } from './PreviewCanvas';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';

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
            <PreviewCanvas />
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
