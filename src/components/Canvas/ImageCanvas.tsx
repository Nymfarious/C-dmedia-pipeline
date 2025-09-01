import React, { useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Undo2, Redo2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Asset, ImageEditParams } from '@/types/media';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { AssetImportModal } from "../AssetImportModal";
import { EmptyCanvas } from './EmptyCanvas';
import { InpaintingTool } from './InpaintingTool';
import { TextGenerationTool } from './TextGenerationTool';
import { ProjectSaveLoad } from '../ProjectSaveLoad';
import { saveCurrentSession } from '@/lib/localStorage';
interface ImageCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}
export function ImageCanvas({
  asset,
  onAssetUpdate
}: ImageCanvasProps) {
  // Clean up unused state
  const [history, setHistory] = useState<Asset[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    enqueueStep,
    runStep,
    generateDirectly,
    assets,
    addAsset,
    activeTool,
    setActiveTool
  } = useAppStore();

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
  const handleDirectGenerate = async (prompt: string, provider: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    setIsGenerating(true);
    try {
      const newAsset = await generateDirectly({
        prompt
      }, provider);
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
  const handleInpaintingComplete = async (params: ImageEditParams) => {
    if (!asset) return;
    try {
      const stepId = enqueueStep('EDIT', [asset.id], params, 'replicate.nano-banana');
      await runStep(stepId);
      const {
        steps,
        assets: updatedAssets
      } = useAppStore.getState();
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

  const handleTextGenerationComplete = (newAsset: Asset) => {
    addAsset(newAsset);
    onAssetUpdate?.(newAsset);
    addToHistory(newAsset);
    setActiveTool(null);
    toast.success('Text added successfully!');
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
    return <Card className="h-full bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Image Canvas</CardTitle>
            <ProjectSaveLoad currentAsset={asset} onProjectLoad={(loadedAssets, currentAssetId) => {
            Object.values(loadedAssets).forEach(addAsset);
            if (currentAssetId && loadedAssets[currentAssetId]) {
              onAssetUpdate?.(loadedAssets[currentAssetId]);
              addToHistory(loadedAssets[currentAssetId]);
            }
          }} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6">
          <EmptyCanvas onGenerate={handleDirectGenerate} onImport={() => setShowImportDialog(true)} isGenerating={isGenerating} />
          <AssetImportModal isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} onImport={handleImportAsset} />
        </CardContent>
      </Card>;
  }
  
  return <Card className="h-full bg-card">
      <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Image Canvas</CardTitle>
            <div className="flex items-center gap-1">
            <ProjectSaveLoad currentAsset={asset} onProjectLoad={(loadedAssets, currentAssetId) => {
            Object.values(loadedAssets).forEach(addAsset);
            if (currentAssetId && loadedAssets[currentAssetId]) {
              onAssetUpdate?.(loadedAssets[currentAssetId]);
              addToHistory(loadedAssets[currentAssetId]);
            }
          }} />
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo} className="text-muted-foreground hover:text-foreground">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo} className="text-muted-foreground hover:text-foreground">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={downloadAsset} disabled={!asset} className="text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">

        <div className="space-y-6 flex-1">
          {/* Inpainting Tool - Always show when activeTool is 'inpaint' */}
          {activeTool === 'inpaint' && asset && (
            <ScrollArea className="max-h-[80vh]">
              <InpaintingTool 
                asset={asset} 
                onComplete={handleInpaintingComplete} 
                onCancel={() => setActiveTool(null)} 
                className="w-full" 
              />
            </ScrollArea>
          )}

          {/* Text Generation Tool - Show when activeTool is 'text' */}
          {activeTool === 'text' && asset && (
            <TextGenerationTool
              asset={asset}
              onComplete={handleTextGenerationComplete}
              onCancel={() => setActiveTool(null)}
              className="w-full"
            />
          )}
          
          {/* Canvas Container - Show image when no tool is active */}
          {activeTool !== 'inpaint' && activeTool !== 'text' && (
            <div className="relative bg-card rounded-lg border border-border">
              <div className="relative min-h-[400px] rounded-lg overflow-hidden">
                <img src={asset.src} alt={asset.name} className="w-full h-full object-contain" style={{
                  maxHeight: '70vh'
                }} />
              </div>
            </div>
          )}

          {/* Asset Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{asset.name}</h3>
              <div className="flex flex-wrap gap-2">
                {asset.meta?.width && asset.meta?.height && <Badge variant="secondary">
                    {asset.meta.width} × {asset.meta.height}
                  </Badge>}
                <Badge variant="outline">{asset.type}</Badge>
                {asset.meta?.provider && <Badge variant="outline">{asset.meta.provider}</Badge>}
              </div>
            </div>

            {asset.meta?.prompt && <div>
                <h4 className="text-sm font-medium mb-2">Original Prompt</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {asset.meta.prompt}
                </p>
              </div>}
          </div>
        </div>

        {/* Import Asset Modal */}
        <AssetImportModal isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} onImport={handleImportAsset} />
      </CardContent>
    </Card>;
}