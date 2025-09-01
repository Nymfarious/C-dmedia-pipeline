import React, { useEffect, useState } from 'react';
import { ImageIcon, UploadIcon, SparklesIcon, PaintbrushIcon, ZoomInIcon, ZoomOutIcon, RotateCwIcon, RefreshCwIcon, CheckIcon, LoaderIcon, Trash, Wand2 } from 'lucide-react';
import useAppStore from '@/store/appStore';
// Modal now handled at App level
import { Asset, PipelineStep } from '@/types/media';
import { toast } from 'sonner';
import { ImageCanvas } from './Canvas/ImageCanvas';
interface WorkspaceProps {
  activeTab: string;
  selectedTool: string;
  addToHistory: (action: any) => void;
}
export function Workspace({
  activeTab,
  selectedTool,
  addToHistory
}: WorkspaceProps) {
  const [hasContent, setHasContent] = useState(false);
  const [brushOptions, setBrushOptions] = useState({
    visible: false,
    color: '#ffffff',
    size: 12,
    opacity: 100
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  const [showAIActions, setShowAIActions] = useState(false);

  // Use narrow store selectors to prevent unnecessary rerenders
  const activeCanvas = useAppStore(state => state.activeCanvas);
  const canvasesLength = useAppStore(state => state.canvases.length);
  const canvases = useAppStore(state => state.canvases);
  const createCanvas = useAppStore(state => state.createCanvas);
  const setActiveCanvas = useAppStore(state => state.setActiveCanvas);
  const updateCanvasAsset = useAppStore(state => state.updateCanvasAsset);
  const getActiveCanvasWithAsset = useAppStore(state => state.getActiveCanvasWithAsset);
  const enqueueStep = useAppStore(state => state.enqueueStep);
  const runStep = useAppStore(state => state.runStep);
  const generateDirectly = useAppStore(state => state.generateDirectly);
  const activeTool = useAppStore(state => state.activeTool);
  console.log('Workspace render - activeCanvas:', activeCanvas, 'canvases:', canvasesLength);
  console.log('Workspace render - activeTool:', activeTool);

  // Sync canvas state to local state - with proper guarding to prevent loops
  const prevAppliedRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    if (!activeCanvas) {
      setHasContent(false);
      setGeneratedImage(null);
      prevAppliedRef.current = null;
      return;
    }
    
    // Prevent re-applying the same canvas
    if (prevAppliedRef.current === activeCanvas) return;
    
    const currentCanvas = canvases.find(c => c.id === activeCanvas);
    if (currentCanvas?.asset) {
      console.log('Workspace - Setting content from canvas:', currentCanvas.asset.name);
      setHasContent(true);
      setGeneratedImage(currentCanvas.asset);
      prevAppliedRef.current = activeCanvas;
    } else {
      console.log('Workspace - Active canvas asset not found');
      setHasContent(false);
      setGeneratedImage(null);
      prevAppliedRef.current = null;
    }
  }, [activeCanvas, canvases]);

  // Fix brush options with functional update to avoid stale closure
  useEffect(() => {
    setBrushOptions(prev => ({
      ...prev,
      visible: selectedTool === 'brush' && hasContent
    }));
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
        minute: '2-digit'
      })
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
          minute: '2-digit'
        })
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
          minute: '2-digit'
        })
      });
    }
  };
  const handleAIAction = (action: string) => {
    const activeCanvasWithAsset = getActiveCanvasWithAsset();
    if (!activeCanvasWithAsset?.asset) {
      toast.error("No image on canvas to process");
      return;
    }
    setProcessingAction(action);

    // Map action to step kind and provider
    let stepKind: PipelineStep["kind"];
    let providerKey: string;
    let instruction = '';
    switch (action) {
      case 'remove_bg':
        stepKind = "REMOVE_BG";
        providerKey = "replicate.birefnet"; // Use better background removal
        instruction = "Remove the background from this image";
        break;
      case 'enhance':
        stepKind = "UPSCALE";
        providerKey = "replicate.nano-banana";
        instruction = "Enhance and improve the quality of this image";
        break;
      case 'style_transfer':
        stepKind = "EDIT";
        providerKey = "replicate.nano-banana";
        instruction = "Apply an artistic style to this image";
        break;
      default:
        stepKind = "EDIT";
        providerKey = "replicate.nano-banana";
    }

    // Enqueue and run the step
    const stepId = enqueueStep(stepKind, [activeCanvasWithAsset.asset.id], {
      instruction
    }, providerKey);
    runStep(stepId).then(() => {
      setProcessingAction(null);
      toast.success(`${action.replace('_', ' ')} completed successfully!`);
    }).catch(error => {
      console.error('AI action failed:', error);
      toast.error(`Failed to ${action.replace('_', ' ')}: ${error.message}`);
      setProcessingAction(null);
    });
  };
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(Math.min(zoom + 25, 400));
    } else {
      setZoom(Math.max(zoom - 25, 25));
    }
  };

  // If inpaint tool is active and we have content, show ImageCanvas
  if (activeTool === 'inpaint' && hasContent && generatedImage) {
    console.log('Workspace - Showing ImageCanvas for inpaint tool');
    return <div className="flex-1 bg-background">
        <ImageCanvas asset={generatedImage} onAssetUpdate={updatedAsset => {
        console.log('Workspace - Asset updated from ImageCanvas:', updatedAsset.id);
        setGeneratedImage(updatedAsset);
        // Update the canvas in the store as well
        const currentCanvas = canvases.find(c => c.id === activeCanvas);
        if (currentCanvas) {
          updateCanvasAsset(currentCanvas.id, updatedAsset);
        }
      }} />
      </div>;
  }
  return <div className="flex-1 bg-background flex items-center justify-center relative">
      {!hasContent ? <div className="flex flex-col items-center justify-center max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <SparklesIcon size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Create Your Canvas</h2>
          <p className="text-muted-foreground mb-8">
            Start by generating an image with AI or import an existing asset
          </p>
          <div className="grid grid-cols-2 gap-4 w-full">
            <button onClick={handleCreateCanvas} className="flex flex-col items-center justify-center p-6 bg-card rounded-lg hover:bg-muted border border-border">
              <SparklesIcon size={24} className="mb-2 text-primary" />
              <span>Generate with AI</span>
            </button>
            <button onClick={handleUpload} className="flex flex-col items-center justify-center p-6 bg-card rounded-lg hover:bg-muted border border-border">
              <UploadIcon size={24} className="mb-2 text-blue-500" />
              <span>Import File</span>
            </button>
          </div>
        </div> : <div className="relative w-full h-full flex items-center justify-center" onMouseEnter={() => setShowAIActions(true)} onMouseLeave={() => setShowAIActions(false)}>
          {/* Canvas area */}
          <div className="bg-white rounded-md shadow-lg w-4/5 h-4/5 flex items-center justify-center relative overflow-hidden">
            {/* Drop zone for assets */}
            <div className="absolute inset-0 rounded-md" onDragOver={e => e.preventDefault()} onDrop={async e => {
          e.preventDefault();
          try {
            const transferData = e.dataTransfer.getData('application/json');
            if (!transferData) {
              console.error('No transfer data available');
              return;
            }
            const assetData = JSON.parse(transferData) as Asset;
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
                minute: '2-digit'
              })
            });
          } catch (err) {
            console.error('Failed to add asset', err);
          }
        }}>
              {/* Canvas content */}
              {generatedImage ? <img src={generatedImage.src} alt={generatedImage.name} className="max-w-full max-h-full object-contain" style={{
            transform: `scale(${zoom / 100})`
          }} /> : <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  {isGenerating ? <>
                      <LoaderIcon size={32} className="animate-spin text-primary mb-2" />
                      <p className="text-gray-800">Generating your image...</p>
                    </> : processingAction ? <>
                      <LoaderIcon size={32} className="animate-spin text-primary mb-2" />
                      <p className="text-gray-800">
                        {processingAction === 'remove_bg' && 'Removing background...'}
                        {processingAction === 'enhance' && 'Enhancing image...'}
                        {processingAction === 'style_transfer' && 'Applying style transfer...'}
                      </p>
                    </> : <p className="text-gray-800">
                      {selectedTool === 'brush' ? 'Click and drag to paint' : 'Your canvas content'}
                    </p>}
                </div>}
            </div>
            {/* Brush cursor overlay */}
            {brushOptions.visible && <div className="absolute inset-0 cursor-none" onMouseMove={e => {
          const cursor = document.getElementById('brush-cursor');
          if (cursor) {
            const rect = e.currentTarget.getBoundingClientRect();
            cursor.style.left = `${e.clientX - rect.left}px`;
            cursor.style.top = `${e.clientY - rect.top}px`;
          }
        }}>
                <div id="brush-cursor" className="absolute rounded-full pointer-events-none" style={{
            width: `${brushOptions.size}px`,
            height: `${brushOptions.size}px`,
            backgroundColor: brushOptions.color,
            opacity: brushOptions.opacity / 200,
            transform: 'translate(-50%, -50%)',
            border: '1px solid white',
            mixBlendMode: 'difference'
          }} />
              </div>}
          </div>
          {/* Quick tools that appear when using brush */}
          {selectedTool === 'brush' && <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card rounded-md shadow-lg p-2 flex items-center space-x-3 border border-border">
              <div>
                <label className="block text-xs mb-1">Size</label>
                <input type="range" min="1" max="100" value={brushOptions.size} onChange={e => setBrushOptions({
            ...brushOptions,
            size: parseInt(e.target.value)
          })} className="w-24 accent-primary" />
              </div>
              <div>
                <label className="block text-xs mb-1">Color</label>
                <div className="flex items-center space-x-1">
                  {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => <button key={color} className="w-5 h-5 rounded-full border border-border" style={{
              backgroundColor: color
            }} onClick={() => setBrushOptions({
              ...brushOptions,
              color
            })} />)}
                </div>
              </div>
              <div>
                <button className="bg-primary hover:bg-primary/90 rounded-md px-3 py-1 text-xs text-primary-foreground">
                  <PaintbrushIcon size={12} className="inline-block mr-1" />
                  More Options
                </button>
              </div>
            </div>}
          {/* Canvas controls */}
          
          {/* AI Quick Actions - Only show on hover */}
          {showAIActions}
        </div>}
      {/* AI Generation Modal now handled at App level */}
    </div>;
}