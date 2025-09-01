import React, { useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Undo2, 
  Redo2, 
  Download, 
  Scissors,
  ZoomIn,
  RotateCw,
  Eraser,
  Sparkles,
  Import,
  Upload,
  Loader2,
  Paintbrush
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { AssetImportModal } from "../AssetImportModal";
import { EmptyCanvas } from './EmptyCanvas';
import { EnhancedObjectEditTool } from './EnhancedObjectEditTool';
import { ColorAdjustmentPanel } from './ColorAdjustmentPanel';
import { StyleFilterGallery } from './StyleFilterGallery';
import { PoseEditor } from './PoseEditor';
import { CropTool } from './CropTool';
import { FaceSwapTool } from './FaceSwapTool';
import { InpaintingTool } from './InpaintingTool';
import { ProjectSaveLoad } from '../ProjectSaveLoad';
import { objectRemoverAdapter } from '@/adapters/image-edit/objectRemover';
import { objectAdderAdapter } from '@/adapters/image-edit/objectAdder';
import { saveCurrentSession } from '@/lib/localStorage';
import { colorEnhancerAdapter } from '@/adapters/image-edit/colorEnhancer';
import { enhancedUpscalerAdapter } from '@/adapters/image-edit/enhancedUpscaler';

interface ImageCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}

export function ImageCanvas({ asset, onAssetUpdate }: ImageCanvasProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [history, setHistory] = useState<Asset[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showObjectEditTool, setShowObjectEditTool] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showStyleGallery, setShowStyleGallery] = useState(false);
  const [showPoseEditor, setShowPoseEditor] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [showFaceSwapTool, setShowFaceSwapTool] = useState(false);
  const [enhanceFaces, setEnhanceFaces] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueStep, runStep, generateDirectly, assets, addAsset, activeTool, inpaintingMode, setActiveTool } = useAppStore();

  // Force state debugging on every render
  console.log('🔍 ImageCanvas render - asset:', !!asset, asset?.id, asset?.name);
  console.log('🔍 ImageCanvas render - activeTool:', activeTool, 'inpaintingMode:', inpaintingMode);
  console.log('🔍 ImageCanvas render - will show inpaint tool:', activeTool === 'inpaint');
  
  // Add useEffect to track state changes
  React.useEffect(() => {
    console.log('🔄 ImageCanvas useEffect - activeTool changed to:', activeTool);
    console.log('🔄 ImageCanvas useEffect - inpaintingMode changed to:', inpaintingMode);
  }, [activeTool, inpaintingMode]);

  const tools = [
    { id: 'background-remove', label: 'Remove Background', icon: Eraser, needsAsset: true },
    { id: 'object-edit', label: 'Edit Objects', icon: Scissors, needsAsset: true },
    { id: 'inpaint', label: 'AI Inpainting', icon: Paintbrush, needsAsset: true },
    { id: 'upscale', label: 'Enhanced Upscale', icon: ZoomIn, needsAsset: true },
    { id: 'color-adjust', label: 'Color & Style', icon: Sparkles, needsAsset: true },
    { id: 'rotate', label: 'Rotate', icon: RotateCw, needsAsset: true },
    { id: 'import', label: 'Import Asset', icon: Import, needsAsset: false }
  ];

  const addToHistory = useCallback((newAsset: Asset) => {
    if (asset) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAsset);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex, asset]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousAsset = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onAssetUpdate?.(previousAsset);
    }
  }, [history, historyIndex, onAssetUpdate]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextAsset = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onAssetUpdate?.(nextAsset);
    }
  }, [history, historyIndex, onAssetUpdate]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleToolAction = async (toolId: string) => {
    if (toolId === 'import') {
      setShowImportDialog(true);
      return;
    }

    if (!asset) {
      toast.error('No asset loaded');
      return;
    }

    setSelectedTool(toolId);
    
    try {
      switch (toolId) {
        case 'background-remove':
          await handleBackgroundRemoval();
          break;
        case 'object-edit':
          setShowObjectEditTool(true);
          break;
        case 'inpaint':
          console.log('🎨 Activating inpaint tool via handleToolAction');
          setActiveTool('inpaint');
          break;
        case 'upscale':
          await handleEnhancedUpscale();
          break;
        case 'color-adjust':
          setShowColorPanel(true);
          setShowStyleGallery(true);
          break;
        case 'rotate':
          await handleRotate();
          break;
        default:
          console.log(`Tool ${toolId} not implemented yet`);
      }
    } catch (error) {
      console.error(`Error with tool ${toolId}:`, error);
      toast.error(`Failed to apply ${toolId}`);
    } finally {
      setSelectedTool(null);
    }
  };

  const handleDirectGenerate = async (prompt: string, provider: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const newAsset = await generateDirectly(
        { prompt },
        provider
      );
      
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportAsset = (importedAsset: Asset) => {
    onAssetUpdate?.(importedAsset);
    addToHistory(importedAsset);
    setShowImportDialog(false);
    toast.success('Asset imported to canvas');
  };

  const handleBackgroundRemoval = async () => {
    if (!asset) return;
    
    try {
      const stepId = enqueueStep('REMOVE_BG', [asset.id], {}, 'replicate.rembg');
      await runStep(stepId);
      toast.success('Background removed successfully!');
    } catch (error) {
      console.error('Background removal error:', error);
      toast.error('Failed to remove background');
    }
  };

  const handleEnhancedUpscale = async () => {
    if (!asset) return;
    
    try {
      const params: ImageEditParams = {
        operation: 'general-edit',
        upscaleFactor: upscaleFactor,
        enhanceFaces: enhanceFaces
      };
      
      const newAsset = await enhancedUpscalerAdapter.edit(asset, params);
      addAsset(newAsset);
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      toast.success(`Image upscaled ${upscaleFactor}x successfully!`);
    } catch (error) {
      console.error('Enhanced upscale error:', error);
      toast.error('Failed to upscale image');
    }
  };

  const handleObjectEdit = async (params: ImageEditParams) => {
    if (!asset) return;
    
    try {
      let newAsset: Asset;
      
      if (params.operation === 'remove-object') {
        newAsset = await objectRemoverAdapter.edit(asset, params);
        toast.success('Objects removed successfully!');
      } else if (params.operation === 'add-object') {
        newAsset = await objectAdderAdapter.edit(asset, params);
        toast.success('Objects added successfully!');
      } else {
        throw new Error('Unknown object edit operation');
      }
      
      addAsset(newAsset);
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      setShowObjectEditTool(false);
      
      // Auto-save session
      await saveCurrentSession({ ...assets, [newAsset.id]: newAsset }, newAsset.id);
    } catch (error) {
      console.error('Object edit error:', error);
      toast.error(`Failed to ${params.operation === 'remove-object' ? 'remove' : 'add'} objects`);
    }
  };

  const handleColorAdjustment = async (adjustments: any) => {
    if (!asset) return;
    
    try {
      const params: ImageEditParams = {
        operation: 'enhance-colors',
        colorAdjustments: adjustments
      };
      
      const newAsset = await colorEnhancerAdapter.edit(asset, params);
      addAsset(newAsset);
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      toast.success('Colors adjusted successfully!');
    } catch (error) {
      console.error('Color adjustment error:', error);
      toast.error('Failed to adjust colors');
    }
  };

  const handleStyleFilter = async (stylePreset: string) => {
    if (!asset) return;
    
    try {
      const params: ImageEditParams = {
        operation: 'style-transfer',
        stylePreset: stylePreset as any
      };
      
      const newAsset = await colorEnhancerAdapter.edit(asset, params);
      addAsset(newAsset);
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      toast.success(`${stylePreset} style applied successfully!`);
    } catch (error) {
      console.error('Style filter error:', error);
      toast.error('Failed to apply style filter');
    }
  };

  const handleInpaintingComplete = async (params: ImageEditParams) => {
    if (!asset) return;
    
    try {
      const stepId = enqueueStep('EDIT', [asset.id], params, 'replicate.nano-banana');
      await runStep(stepId);
      
      const { steps, assets: updatedAssets } = useAppStore.getState();
      const step = steps[stepId];
      if (step.status === "done" && step.outputAssetId) {
        const editedAsset = updatedAssets[step.outputAssetId];
        addAsset(editedAsset);
        onAssetUpdate?.(editedAsset);
        addToHistory(editedAsset);
        toast.success('Inpainting completed successfully!');
      }
    } catch (error) {
      console.error('Inpainting error:', error);
      toast.error('Failed to complete inpainting');
    }
  };

  const handleRotate = async () => {
    console.log('Rotate tool selected');
    toast.info('Rotation coming soon!');
  };

  const downloadAsset = async () => {
    if (!asset) return;
    
    try {
      const blob = await fetchBlobFromUrl(asset.src);
      const extension = getFileExtensionFromBlob(blob);
      downloadBlob(blob, `${asset.name || 'image'}.${extension}`);
      toast.success('Asset downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download asset');
    }
  };

  // Show empty canvas if no asset
  if (!asset) {
    console.log('ImageCanvas - No asset provided, showing empty canvas');
    return (
      <Card className="h-full bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Image Canvas</CardTitle>
            <ProjectSaveLoad 
              currentAsset={asset} 
              onProjectLoad={(loadedAssets, currentAssetId) => {
                Object.values(loadedAssets).forEach(addAsset);
                if (currentAssetId && loadedAssets[currentAssetId]) {
                  onAssetUpdate?.(loadedAssets[currentAssetId]);
                  addToHistory(loadedAssets[currentAssetId]);
                }
              }} 
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6">
          <EmptyCanvas 
            onGenerate={handleDirectGenerate}
            onImport={() => setShowImportDialog(true)}
            isGenerating={isGenerating}
          />
          <AssetImportModal
            isOpen={showImportDialog}
            onClose={() => setShowImportDialog(false)}
            onImport={handleImportAsset}
          />
        </CardContent>
      </Card>
    );
  }

  console.log('ImageCanvas - Rendering with asset:', asset.name, asset.src);
  
  return (
    <Card className="h-full bg-card">
      <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Image Canvas</CardTitle>
            <div className="flex items-center gap-2">
            <ProjectSaveLoad 
              currentAsset={asset} 
              onProjectLoad={(loadedAssets, currentAssetId) => {
                Object.values(loadedAssets).forEach(addAsset);
                if (currentAssetId && loadedAssets[currentAssetId]) {
                  onAssetUpdate?.(loadedAssets[currentAssetId]);
                  addToHistory(loadedAssets[currentAssetId]);
                }
              }} 
            />
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="text-muted-foreground hover:text-foreground"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsset}
              disabled={!asset}
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="py-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.id || 
                (tool.id === 'object-edit' && showObjectEditTool) ||
                (tool.id === 'color-adjust' && (showColorPanel || showStyleGallery));
              
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolAction(tool.id)}
                  className="flex items-center gap-2"
                  disabled={tool.needsAsset && !asset}
                >
                  <Icon className="h-4 w-4" />
                  {tool.label}
                </Button>
              );
            })}
          </div>
          
          {/* Enhanced Upscale Options */}
          {selectedTool === 'upscale' && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Scale:</span>
                  <Select value={upscaleFactor.toString()} onValueChange={(v) => setUpscaleFactor(Number(v))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="4">4x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enhanceFaces}
                    onCheckedChange={setEnhanceFaces}
                  />
                  <span className="text-sm">Enhance Faces</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 flex-1">
          {/* Editing Tools */}
          {showObjectEditTool && (
            <EnhancedObjectEditTool
              imageUrl={asset.src}
              onEditComplete={handleObjectEdit}
              onCancel={() => setShowObjectEditTool(false)}
              className="w-full"
            />
          )}
          
          {(showColorPanel || showStyleGallery) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {showColorPanel && (
                <ColorAdjustmentPanel
                  onAdjustment={handleColorAdjustment}
                  className="w-full"
                />
              )}
              
              {showStyleGallery && (
                <StyleFilterGallery
                  onStyleApply={handleStyleFilter}
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* Inpainting Tool - Always show when activeTool is 'inpaint' */}
          {(() => {
            console.log('🎯 Checking inpaint condition - activeTool:', activeTool, 'equals inpaint:', activeTool === 'inpaint');
            return activeTool === 'inpaint';
          })() && (
            <div className="space-y-4 bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">🎨 AI Inpainting Tool</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                   <div>Tool: <Badge variant="outline">{activeTool}</Badge></div>
                   <div>Mode: <Badge variant={inpaintingMode ? "default" : "secondary"}>
                     {inpaintingMode ? 'Active' : 'Inactive'}
                   </Badge></div>
                 </div>
              </div>
              {asset ? (
                <InpaintingTool
                  asset={asset}
                  onComplete={handleInpaintingComplete}
                  onCancel={() => {
                    console.log('🚫 Inpainting cancelled');
                    setActiveTool('select');
                  }}
                  className="w-full"
                />
              ) : (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive">No asset available for inpainting</p>
                </div>
              )}
            </div>
          )}
          
          {/* Debug info when tool should show but doesn't */}
          {activeTool === 'inpaint' && !inpaintingMode && (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-sm text-yellow-800">
                Debug: Inpaint tool is selected but inpainting mode is disabled.
                Active tool: {activeTool}, Inpainting mode: {inpaintingMode.toString()}
              </p>
            </div>
          )}
          
          {/* Canvas Container - Only show when no editing tool is active */}
          {!showObjectEditTool && !showColorPanel && !showStyleGallery && activeTool !== 'inpaint' && (
            <div className="relative bg-card rounded-lg border border-border">
              <div className="relative min-h-[400px] rounded-lg overflow-hidden">
                <img
                  src={asset.src}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '70vh' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Asset Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{asset.name}</h3>
              <div className="flex flex-wrap gap-2">
                {asset.meta?.width && asset.meta?.height && (
                  <Badge variant="secondary">
                    {asset.meta.width} × {asset.meta.height}
                  </Badge>
                )}
                <Badge variant="outline">{asset.type}</Badge>
                {asset.meta?.provider && (
                  <Badge variant="outline">{asset.meta.provider}</Badge>
                )}
              </div>
            </div>

            {asset.meta?.prompt && (
              <div>
                <h4 className="text-sm font-medium mb-2">Original Prompt</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {asset.meta.prompt}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Import Asset Modal */}
        <AssetImportModal
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportAsset}
        />
      </CardContent>
    </Card>
  );
}