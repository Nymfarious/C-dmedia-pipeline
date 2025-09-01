import { useEffect, useState } from 'react';
import { Asset, ImageEditParams } from '@/types/media';
import { Header } from '@/components/Header';
import { ToolbarTop } from '@/components/ToolbarTop';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { Gallery } from '@/components/Gallery';

import useAppStore from '@/store/appStore';

export function Dashboard() {
  const [showGallery, setShowGallery] = useState(false);
  
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

  

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    
    // Handle video generation tool specifically
    if (tool === 'video') {
      const canvasId = createCanvas('video');
      setActiveCanvas(canvasId);
    }
  };

  const loadAssetToCanvas = (asset: Asset) => {
    const canvasId = createCanvas(asset.type as 'image' | 'video' | 'audio', asset);
    setActiveCanvas(canvasId);
  };

  const currentCanvas = canvases.find(c => c.id === activeCanvas);

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
        onGalleryToggle={() => setShowGallery(!showGallery)}
      />
      
      {/* Toolbar */}
      <ToolbarTop 
        activeTab={activeCanvas || 'image'}
        selectedTool={activeTool}
        onToolChange={handleToolChange}
        toggleRightPanel={() => {}}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gallery Sidebar - Conditional */}
        {showGallery && (
          <div className="w-80 border-r border-border bg-card">
            <Gallery />
          </div>
        )}
        
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

    </div>
  );
}