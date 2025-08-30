import { useState } from 'react';
import { Asset, ImageEditParams } from '@/types/media';
import { Header } from '@/components/Header';
import { Toolbar } from '@/components/Toolbar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import useAppStore from '@/store/appStore';

export function Dashboard() {
  const [canvases, setCanvases] = useState<Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    asset?: Asset;
    createdAt: number;
  }>>([]);
  
  const [activeCanvas, setActiveCanvas] = useState<string | null>(null);

  const createCanvas = (type: 'image' | 'video' | 'audio') => {
    const newCanvas = {
      id: crypto.randomUUID(),
      type,
      name: `New ${type} canvas`,
      createdAt: Date.now(),
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvas(newCanvas.id);
  };

  const loadAssetToCanvas = (asset: Asset) => {
    // Create a new canvas with the asset loaded
    const newCanvas = {
      id: crypto.randomUUID(),
      type: asset.type as 'image' | 'video' | 'audio',
      name: asset.name,
      asset,
      createdAt: Date.now(),
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvas(newCanvas.id);
  };

  const updateCanvasAsset = (canvasId: string, asset: Asset) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId 
        ? { ...canvas, asset }
        : canvas
    ));
  };

  const currentCanvas = canvases.find(c => c.id === activeCanvas);

  const handleEditComplete = async (params: ImageEditParams) => {
    if (!currentCanvas?.asset) return;
    
    const store = useAppStore.getState();
    const stepId = store.enqueueStep("EDIT", [currentCanvas.asset.id], params, params.provider || "replicate.nano-banana");
    await store.runStep(stepId);
    
    const step = store.steps[stepId];
    if (step.status === "done" && step.outputAssetId) {
      const editedAsset = store.assets[step.outputAssetId];
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
      <Toolbar />
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar 
          canvases={canvases}
          activeCanvas={activeCanvas}
          onCreateCanvas={createCanvas}
          onSelectCanvas={setActiveCanvas}
          onLoadAssetToCanvas={loadAssetToCanvas}
        />
        
        {/* Center Workspace */}
        <CenterWorkspace 
          currentCanvas={currentCanvas}
          onCanvasAssetUpdate={updateCanvasAsset}
          onCreateCanvas={createCanvas}
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