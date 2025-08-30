import React, { useEffect, useState } from 'react';
import {
  ImageIcon,
  UploadIcon,
  SparklesIcon,
  PaintbrushIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  RefreshCwIcon,
  CheckIcon,
  LoaderIcon,
  Trash,
  Wand2,
} from 'lucide-react';
import useAppStore from '@/store/appStore';
import { AIGenerationModal } from './AIGenerationModal';
import { Asset } from '@/types/media';

interface WorkspaceProps {
  activeTab: string;
  selectedTool: string;
  addToHistory: (action: any) => void;
}

export function Workspace({ activeTab, selectedTool, addToHistory }: WorkspaceProps) {
  const [hasContent, setHasContent] = useState(false);
  const [brushOptions, setBrushOptions] = useState({
    visible: false,
    color: '#ffffff',
    size: 12,
    opacity: 100,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<any>(null);

  // Subscribe to global canvas state
  const { activeCanvas, canvases, createCanvas, setActiveCanvas, updateCanvasAsset } = useAppStore(s => ({
    activeCanvas: s.activeCanvas,
    canvases: s.canvases,
    createCanvas: s.createCanvas,
    setActiveCanvas: s.setActiveCanvas,
    updateCanvasAsset: s.updateCanvasAsset,
  }));

  // Sync local state with global canvas state
  useEffect(() => {
    console.log('Workspace - Canvas state changed:', { activeCanvas, canvasCount: canvases.length });
    const currentCanvas = canvases.find(c => c.id === activeCanvas);
    if (currentCanvas?.asset) {
      console.log('Workspace - Setting content from canvas:', currentCanvas.asset.name);
      setHasContent(true);
      setGeneratedImage(currentCanvas.asset);
    } else if (activeCanvas && !currentCanvas) {
      console.log('Workspace - Active canvas not found, clearing content');
      setHasContent(false);
      setGeneratedImage(null);
    }
  }, [activeCanvas, canvases.length]); // Only depend on length, not the array itself

  useEffect(() => {
    if (selectedTool === 'brush' && hasContent) {
      setBrushOptions({
        ...brushOptions,
        visible: true,
      });
    } else {
      setBrushOptions({
        ...brushOptions,
        visible: false,
      });
    }
  }, [selectedTool, hasContent]);

  const handleCreateCanvas = () => {
    setIsGenerationModalOpen(true);
  };

  const handleUpload = () => {
    // Simulate file upload
    setHasContent(true);
    addToHistory({
      type: 'upload',
      tab: activeTab,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  const handleGenerate = async (generationOptions: any) => {
    setIsGenerating(true);
    try {
      const asset = await useAppStore.getState().generateDirectly({
        prompt: generationOptions.prompt,
        style: generationOptions.style,
        quality: generationOptions.quality,
        negativePrompt: generationOptions.negativePrompt,
        seed: generationOptions.seed
      }, generationOptions.model);
      
      setIsGenerating(false);
      setHasContent(true);
      setGeneratedImage(asset);
      addToHistory({
        type: 'ai_generation',
        tab: activeTab,
        prompt: generationOptions.prompt,
        model: generationOptions.model,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (error) {
      setIsGenerating(false);
      console.error('Generation failed:', error);
      addToHistory({
        type: 'generation_error',
        tab: activeTab,
        error: error instanceof Error ? error.message : 'Unknown error',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  };

  const handleAIAction = async (action: string) => {
    if (!hasContent || !generatedImage) return;
    setProcessingAction(action);
    
    try {
      const store = useAppStore.getState();
      let result;
      
      if (action === 'remove_bg') {
        const stepId = store.enqueueStep("REMOVE_BG", [generatedImage.id], {}, "replicate.flux");
        await store.runStep(stepId);
        const step = store.steps[stepId];
        if (step.status === "done" && step.outputAssetId) {
          result = store.assets[step.outputAssetId];
        }
      } else if (action === 'enhance') {
        const stepId = store.enqueueStep("UPSCALE", [generatedImage.id], {}, "replicate.flux");
        await store.runStep(stepId);
        const step = store.steps[stepId];
        if (step.status === "done" && step.outputAssetId) {
          result = store.assets[step.outputAssetId];
        }
      } else if (action === 'style_transfer') {
        const stepId = store.enqueueStep("EDIT", [generatedImage.id], { instruction: 'Apply artistic style transfer to this image' }, "replicate.flux");
        await store.runStep(stepId);
        const step = store.steps[stepId];
        if (step.status === "done" && step.outputAssetId) {
          result = store.assets[step.outputAssetId];
        }
      }
      
      if (result) {
        setGeneratedImage(result);
      }
      
      setProcessingAction(null);
      addToHistory({
        type: action,
        tab: activeTab,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (error) {
      setProcessingAction(null);
      console.error(`${action} failed:`, error);
      addToHistory({
        type: `${action}_error`,
        tab: activeTab,
        error: error instanceof Error ? error.message : 'Unknown error',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(Math.min(zoom + 25, 400));
    } else {
      setZoom(Math.max(zoom - 25, 25));
    }
  };

  return (
    <div className="flex-1 bg-background flex items-center justify-center relative">
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <SparklesIcon size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Create Your Canvas</h2>
          <p className="text-muted-foreground mb-8">
            Start by generating an image with AI or import an existing asset
          </p>
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={handleCreateCanvas}
              className="flex flex-col items-center justify-center p-6 bg-card rounded-lg hover:bg-muted border border-border"
            >
              <SparklesIcon size={24} className="mb-2 text-primary" />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={handleUpload}
              className="flex flex-col items-center justify-center p-6 bg-card rounded-lg hover:bg-muted border border-border"
            >
              <UploadIcon size={24} className="mb-2 text-blue-500" />
              <span>Import File</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Canvas area */}
          <div className="bg-white rounded-md shadow-lg w-4/5 h-4/5 flex items-center justify-center relative overflow-hidden">
            {/* Drop zone for assets */}
            <div
              className="absolute inset-0 rounded-md"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                try {
                  const assetData = JSON.parse(
                    e.dataTransfer.getData('application/json'),
                  ) as Asset;
                  
                  console.log('Workspace - Asset dropped:', assetData.name);
                  
                  // If no active canvas, create one. Otherwise, update existing
                  const currentCanvas = canvases.find(c => c.id === activeCanvas);
                  if (!currentCanvas) {
                    const canvasId = createCanvas('image', assetData);
                    setActiveCanvas(canvasId);
                    console.log('Workspace - Created new canvas for dropped asset:', canvasId);
                  } else {
                    updateCanvasAsset(currentCanvas.id, assetData);
                    console.log('Workspace - Updated existing canvas with dropped asset');
                  }
                  
                  setHasContent(true);
                  setGeneratedImage(assetData);
                  addToHistory({
                    type: 'add_asset',
                    asset: assetData,
                    time: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  });
                } catch (err) {
                  console.error('Failed to add asset', err);
                }
              }}
            >
              {/* Canvas content */}
              {generatedImage ? (
                <img 
                  src={generatedImage.src} 
                  alt={generatedImage.name}
                  className="max-w-full max-h-full object-contain"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              ) : (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  {isGenerating ? (
                    <>
                      <LoaderIcon
                        size={32}
                        className="animate-spin text-primary mb-2"
                      />
                      <p className="text-gray-800">Generating your image...</p>
                    </>
                  ) : processingAction ? (
                    <>
                      <LoaderIcon
                        size={32}
                        className="animate-spin text-primary mb-2"
                      />
                      <p className="text-gray-800">
                        {processingAction === 'remove_bg' &&
                          'Removing background...'}
                        {processingAction === 'enhance' && 'Enhancing image...'}
                        {processingAction === 'style_transfer' &&
                          'Applying style transfer...'}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-800">
                      {selectedTool === 'brush'
                        ? 'Click and drag to paint'
                        : 'Your canvas content'}
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Brush cursor overlay */}
            {brushOptions.visible && (
              <div
                className="absolute inset-0 cursor-none"
                onMouseMove={(e) => {
                  const cursor = document.getElementById('brush-cursor');
                  if (cursor) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    cursor.style.left = `${e.clientX - rect.left}px`;
                    cursor.style.top = `${e.clientY - rect.top}px`;
                  }
                }}
              >
                <div
                  id="brush-cursor"
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: `${brushOptions.size}px`,
                    height: `${brushOptions.size}px`,
                    backgroundColor: brushOptions.color,
                    opacity: brushOptions.opacity / 200,
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid white',
                    mixBlendMode: 'difference',
                  }}
                />
              </div>
            )}
          </div>
          {/* Quick tools that appear when using brush */}
          {selectedTool === 'brush' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card rounded-md shadow-lg p-2 flex items-center space-x-3 border border-border">
              <div>
                <label className="block text-xs mb-1">Size</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brushOptions.size}
                  onChange={(e) =>
                    setBrushOptions({
                      ...brushOptions,
                      size: parseInt(e.target.value),
                    })
                  }
                  className="w-24 accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Color</label>
                <div className="flex items-center space-x-1">
                  {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(
                    (color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded-full border border-border"
                        style={{
                          backgroundColor: color,
                        }}
                        onClick={() =>
                          setBrushOptions({
                            ...brushOptions,
                            color,
                          })
                        }
                      />
                    ),
                  )}
                </div>
              </div>
              <div>
                <button className="bg-primary hover:bg-primary/90 rounded-md px-3 py-1 text-xs text-primary-foreground">
                  <PaintbrushIcon size={12} className="inline-block mr-1" />
                  More Options
                </button>
              </div>
            </div>
          )}
          {/* Canvas controls */}
          <div className="absolute top-4 right-4 bg-card rounded-md shadow-lg flex border border-border">
            <button
              className="p-2 hover:bg-muted"
              onClick={() => handleZoom('in')}
              title="Zoom In"
            >
              <ZoomInIcon size={16} />
            </button>
            <div className="px-2 py-1 flex items-center border-l border-r border-border">
              <span className="text-xs">{zoom}%</span>
            </div>
            <button
              className="p-2 hover:bg-muted"
              onClick={() => handleZoom('out')}
              title="Zoom Out"
            >
              <ZoomOutIcon size={16} />
            </button>
            <button
              className="p-2 hover:bg-muted border-l border-border"
              title="Rotate"
            >
              <RotateCwIcon size={16} />
            </button>
          </div>
          {/* AI Quick Actions */}
          <div className="absolute left-4 top-4 bg-card rounded-md shadow-lg border border-border">
            <button
              className="p-2 hover:bg-muted flex items-center"
              onClick={() => handleAIAction('remove_bg')}
              disabled={processingAction !== null}
            >
              <Trash size={16} className="mr-1.5" />
              <span className="text-xs">Remove BG</span>
            </button>
            <button
              className="p-2 hover:bg-muted flex items-center border-t border-border"
              onClick={() => handleAIAction('enhance')}
              disabled={processingAction !== null}
            >
              <SparklesIcon size={16} className="mr-1.5" />
              <span className="text-xs">Enhance</span>
            </button>
            <button
              className="p-2 hover:bg-muted flex items-center border-t border-border"
              onClick={() => handleAIAction('style_transfer')}
              disabled={processingAction !== null}
            >
              <Wand2 size={16} className="mr-1.5" />
              <span className="text-xs">Style</span>
            </button>
          </div>
        </div>
      )}
      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        onGenerate={handleGenerate}
      />
    </div>
  );
}