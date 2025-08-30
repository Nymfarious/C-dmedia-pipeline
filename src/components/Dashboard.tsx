import { useEffect } from 'react';
import { Asset, ImageEditParams } from '@/types/media';
import { Header } from '@/components/Header';
import { Toolbar } from '@/components/Toolbar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import useAppStore from '@/store/appStore';

export function Dashboard() {
  const { 
    enqueueStep, 
    runStep, 
    canvases, 
    activeCanvas, 
    createCanvas, 
    setActiveCanvas, 
    updateCanvasAsset 
  } = useAppStore();

  // Listen for asset loading events from AI generation
  useEffect(() => {
    const handleOpenAssetInCanvas = (event: CustomEvent<Asset>) => {
      const canvasId = createCanvas(event.detail.type as 'image' | 'video' | 'audio', event.detail);
      setActiveCanvas(canvasId);
    };

    window.addEventListener('openAssetInCanvas', handleOpenAssetInCanvas as EventListener);
    return () => {
      window.removeEventListener('openAssetInCanvas', handleOpenAssetInCanvas as EventListener);
    };
  }, [createCanvas, setActiveCanvas]);

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
      />
      
      {/* Toolbar */}
      <Toolbar />
      
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