import { useEffect, useState } from 'react';
import { Asset, ImageEditParams } from '@/types/media';
import { Header } from '@/components/Header';
import { ToolbarTop } from '@/components/ToolbarTop';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { EnhancedAIModal } from '@/components/EnhancedAIModal';
import useAppStore from '@/store/appStore';

export function Dashboard() {
  const { 
    enqueueStep, 
    runStep, 
    canvases, 
    activeCanvas, 
    createCanvas, 
    setActiveCanvas, 
    updateCanvasAsset,
    clearWorkspace,
    loadProjectData,
    activeTool,
    setActiveTool,
    inpaintingMode 
  } = useAppStore();

  const [showAIModal, setShowAIModal] = useState(false);

  console.log('Dashboard render - activeCanvas:', activeCanvas);
  console.log('Dashboard render - canvases:', canvases);
  console.log('Dashboard render - activeTool:', activeTool, 'inpaintingMode:', inpaintingMode);

  const handleToolChange = (tool: string) => {
    console.log('Dashboard - Tool changing to:', tool);
    setActiveTool(tool);
  };

  const loadAssetToCanvas = (asset: Asset) => {
    const canvasId = createCanvas(asset.type as 'image' | 'video' | 'audio', asset);
    setActiveCanvas(canvasId);
  };

  const currentCanvas = canvases.find(c => c.id === activeCanvas);
  
  console.log('Dashboard - Current canvas found:', !!currentCanvas);
  if (currentCanvas) {
    console.log('Dashboard - Current canvas asset:', !!currentCanvas.asset);
  }

  const handleEditComplete = async (params: ImageEditParams) => {
    if (!currentCanvas?.asset) return;
    
    const stepId = enqueueStep("EDIT", [currentCanvas.asset.id], params, params.provider || "replicate.nano-banana");
    await runStep(stepId);
    
    const { steps, assets } = useAppStore.getState();
    const step = steps[stepId];
    if (step.status === "done" && step.outputAssetId) {
      const editedAsset = assets[step.outputAssetId];
      updateCanvasAsset(currentCanvas.id, editedAsset);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <Header 
        activeTab={activeCanvas || 'image'}
        undo={() => {}}
        redo={() => {}}
        canUndo={false}
        canRedo={false}
      />
      
      {/* Toolbar */}
      <ToolbarTop 
        activeTab={activeCanvas || 'image'}
        selectedTool={activeTool}
        onToolChange={handleToolChange}
        toggleRightPanel={() => {}}
        onOpenAIModal={() => setShowAIModal(true)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar 
          canvases={canvases}
          activeCanvas={activeCanvas}
          onCreateCanvas={(type) => {
            const canvasId = createCanvas(type);
            setActiveCanvas(canvasId);
          }}
          onSelectCanvas={setActiveCanvas}
          onLoadAssetToCanvas={loadAssetToCanvas}
          onClearWorkspace={clearWorkspace}
          onLoadProject={loadProjectData}
          onOpenAIModal={() => setShowAIModal(true)}
        />
        
        {/* Center Workspace */}
        <CenterWorkspace 
          currentCanvas={currentCanvas}
          onCanvasAssetUpdate={updateCanvasAsset}
          onCreateCanvas={(type) => {
            const canvasId = createCanvas(type);
            setActiveCanvas(canvasId);
          }}
        />
        
        {/* Right Sidebar */}
        <RightSidebar 
          selectedAsset={currentCanvas?.asset}
          onEditComplete={handleEditComplete}
        />
      </div>

      {/* Enhanced AI Modal */}
      <EnhancedAIModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </div>
  );
}