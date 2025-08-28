import React, { useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Undo2, 
  Redo2, 
  Download, 
  Scissors,
  ZoomIn,
  RotateCw,
  Eraser,
  Sparkles,
  FileImage,
  Import,
  Upload
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { AssetImportModal } from "../AssetImportModal";
import { BrushTool } from './BrushTool';
import { ColorAdjustmentPanel } from './ColorAdjustmentPanel';
import { StyleFilterGallery } from './StyleFilterGallery';
import { PoseEditor } from './PoseEditor';
import { CropTool } from './CropTool';
import { FaceSwapTool } from './FaceSwapTool';
import { geminiNanoAdapter } from '@/adapters/image-edit/geminiNano';
import { objectRemoverAdapter } from '@/adapters/image-edit/objectRemover';
import { colorEnhancerAdapter } from '@/adapters/image-edit/colorEnhancer';
import { enhancedUpscalerAdapter } from '@/adapters/image-edit/enhancedUpscaler';
import { poseAdjustmentAdapter } from '@/adapters/image-edit/poseAdjustment';
import { smartCropAdapter } from '@/adapters/image-edit/smartCrop';
import { faceConsistencyAdapter } from '@/adapters/image-edit/faceConsistency';

interface ImageCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}

export function ImageCanvas({ asset, onAssetUpdate }: ImageCanvasProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [history, setHistory] = useState<Asset[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('replicate.flux');
  const [showBrushTool, setShowBrushTool] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showStyleGallery, setShowStyleGallery] = useState(false);
  const [showPoseEditor, setShowPoseEditor] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [showFaceSwapTool, setShowFaceSwapTool] = useState(false);
  const [enhanceFaces, setEnhanceFaces] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enqueueStep, runStep, generateDirectly, assets, addAsset } = useAppStore();

  const tools = [
    { id: 'background-remove', label: 'Remove Background', icon: Eraser },
    { id: 'object-remove', label: 'Remove Object', icon: Scissors },
    { id: 'upscale', label: 'Enhanced Upscale', icon: ZoomIn },
    { id: 'color-adjust', label: 'Color & Style', icon: Sparkles },
    { id: 'rotate', label: 'Rotate', icon: RotateCw },
    { id: 'import', label: 'Import Asset', icon: Import }
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
        case 'object-remove':
          setShowBrushTool(true);
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

  const handleDirectGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      const newAsset = await generateDirectly(
        { prompt: generatePrompt },
        selectedProvider
      );
      
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      toast.success('Image generated successfully!');
      setGeneratePrompt('');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate image');
    }
  };

  const handleImportAsset = (assetId: string) => {
    const importedAsset = assets[assetId];
    if (importedAsset) {
      onAssetUpdate?.(importedAsset);
      addToHistory(importedAsset);
      setShowImportDialog(false);
      toast.success('Asset imported to canvas');
    }
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

  const handleObjectRemoval = async (brushMask: { x: number; y: number; radius: number }[]) => {
    if (!asset) return;
    
    try {
      const params: ImageEditParams = {
        operation: 'remove-object',
        brushMask: brushMask,
        instruction: 'Remove the marked objects cleanly'
      };
      
      const newAsset = await objectRemoverAdapter.edit(asset, params);
      addAsset(newAsset);
      onAssetUpdate?.(newAsset);
      addToHistory(newAsset);
      setShowBrushTool(false);
      toast.success('Objects removed successfully!');
    } catch (error) {
      console.error('Object removal error:', error);
      toast.error('Failed to remove objects');
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

  return (
    <Card className="h-full bg-canvas-bg">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Image Canvas</CardTitle>
          <div className="flex items-center gap-2">
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

        {/* Direct Generation Controls */}
        {!asset && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate New Image
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replicate.flux">Flux (Fast)</SelectItem>
                    <SelectItem value="replicate.sd">Stable Diffusion</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[80px]"
                />
                <Button onClick={handleDirectGenerate} disabled={!generatePrompt.trim()}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="py-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolAction(tool.id)}
                  className="flex items-center gap-2"
                  disabled={!asset && tool.id !== 'import'}
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

        {asset ? (
          <div className="space-y-6">
            {/* Editing Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {showBrushTool && (
                <div className="lg:col-span-1">
                  <BrushTool
                    imageUrl={asset.src}
                    onMaskComplete={handleObjectRemoval}
                    className="w-full"
                  />
                </div>
              )}
              
              {showColorPanel && (
                <div className="lg:col-span-1">
                  <ColorAdjustmentPanel
                    onAdjustment={handleColorAdjustment}
                    className="w-full"
                  />
                </div>
              )}
              
              {showStyleGallery && (
                <div className="lg:col-span-1">
                  <StyleFilterGallery
                    onStyleApply={handleStyleFilter}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            {/* Canvas Container */}
            <div className="relative bg-canvas-surface rounded-lg border border-border">
              <div className="relative bg-checkered min-h-[400px] rounded-lg overflow-hidden">
                <img
                  src={asset.src}
                  alt={asset.name}
                  className="w-full h-full object-contain"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Asset Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">{asset.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {asset.meta?.width && asset.meta?.height && (
                    <Badge variant="secondary">
                      {asset.meta.width} × {asset.meta.height}
                    </Badge>
                  )}
                  {asset.meta?.provider && (
                    <Badge variant="outline">{asset.meta.provider}</Badge>
                  )}
                  <Badge variant="outline">{asset.type}</Badge>
                  {asset.category && (
                    <Badge variant="secondary">{asset.category}</Badge>
                  )}
                  {asset.subcategory && (
                    <Badge variant="outline">{asset.subcategory}</Badge>
                  )}
                </div>
              </div>

              {asset.derivedFrom && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Derived from:</span> {asset.derivedFrom}
                </div>
              )}

              {asset.meta?.prompt && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Original Prompt</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {asset.meta.prompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
                <FileImage className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Image Loaded</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Generate a new image above or import an asset from your gallery to get started.
              </p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => handleToolAction('import')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from Gallery
              </Button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        <AssetImportModal
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={(importedAsset) => {
            onAssetUpdate?.(importedAsset);
            addToHistory(importedAsset);
            toast.success('Asset imported to canvas');
          }}
        />
      </CardContent>
    </Card>
  );
}