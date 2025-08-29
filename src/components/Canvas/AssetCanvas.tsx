import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Download, Edit3, RotateCw, Palette, ArrowLeft, Trash2, Copy } from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';
import { backgroundRemoverAdapter } from '@/adapters/image-edit/backgroundRemover';
import { objectRemoverAdapter } from '@/adapters/image-edit/objectRemover';
import { objectAdderAdapter } from '@/adapters/image-edit/objectAdder';
import { upscalerAdapter } from '@/adapters/image-edit/upscaler';
import { colorEnhancerAdapter } from '@/adapters/image-edit/colorEnhancer';
import { DrawingOverlay } from './DrawingOverlay';
import useAppStore from '@/store/appStore';
import { toast } from 'sonner';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { cn } from '@/lib/utils';

interface AssetCanvasProps {
  asset: Asset;
  onClose: () => void;
  onAssetUpdate?: (asset: Asset) => void;
}

export function AssetCanvas({ asset, onClose, onAssetUpdate }: AssetCanvasProps) {
  const { addAsset } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'remove' | 'add'>('remove');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<Asset[]>([asset]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [objectInstruction, setObjectInstruction] = useState('');

  const currentAsset = history[historyIndex];

  const addToHistory = (newAsset: Asset) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAsset);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleQuickEdit = async (editType: 'remove-bg' | 'upscale' | 'enhance-color') => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      let result: Asset;
      
      switch (editType) {
        case 'remove-bg':
          result = await backgroundRemoverAdapter.edit(currentAsset, {});
          break;
        case 'upscale':
          result = await upscalerAdapter.edit(currentAsset, { instruction: 'upscale this image' });
          break;
        case 'enhance-color':
          result = await colorEnhancerAdapter.edit(currentAsset, { instruction: 'enhance colors' });
          break;
        default:
          throw new Error('Unknown edit type');
      }

      addAsset(result);
      addToHistory(result);
      onAssetUpdate?.(result);
      toast.success('Edit applied successfully!');
    } catch (error) {
      console.error('Edit failed:', error);
      toast.error(error instanceof Error ? error.message : 'Edit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMaskComplete = async (maskDataUrl: string, maskBlob: Blob) => {
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        maskPngDataUrl: maskDataUrl,
        maskBlob: maskBlob,
      };

      let result: Asset;
      
      if (editMode === 'remove') {
        result = await objectRemoverAdapter.edit(currentAsset, {
          ...params,
          removeObjectInstruction: 'Remove the marked objects cleanly'
        });
      } else {
        if (!objectInstruction.trim()) {
          toast.error('Please provide an instruction for what to add');
          return;
        }
        result = await objectAdderAdapter.edit(currentAsset, {
          ...params,
          instruction: objectInstruction
        });
      }

      addAsset(result);
      addToHistory(result);
      onAssetUpdate?.(result);
      setIsEditing(false);
      setObjectInstruction('');
      toast.success(`Object ${editMode === 'remove' ? 'removal' : 'addition'} completed!`);
    } catch (error) {
      console.error('Edit failed:', error);
      toast.error(error instanceof Error ? error.message : 'Edit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await fetchBlobFromUrl(currentAsset.src);
      const extension = getFileExtensionFromBlob(blob);
      downloadBlob(blob, `${currentAsset.name || 'image'}.${extension}`);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  };

  const handleDuplicate = () => {
    const duplicatedAsset: Asset = {
      ...currentAsset,
      id: crypto.randomUUID(),
      name: `${currentAsset.name} (Copy)`,
      createdAt: Date.now(),
    };
    
    addAsset(duplicatedAsset);
    toast.success('Asset duplicated');
  };

  return (
    <div className="h-full bg-canvas-bg border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-canvas-surface">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{currentAsset.name}</h2>
              <p className="text-sm text-muted-foreground">
                {currentAsset.meta?.width && currentAsset.meta?.height 
                  ? `${currentAsset.meta.width} × ${currentAsset.meta.height}`
                  : 'Image Canvas'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex === 0}
            >
              <RotateCw className="h-4 w-4 rotate-180" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex === history.length - 1}
            >
              <RotateCw className="h-4 w-4" />
              Redo
            </Button>
          </div>
        </div>

        {/* History indicator */}
        {history.length > 1 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Edit History:</span>
            <div className="flex items-center gap-1">
              {history.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === historyIndex 
                      ? "bg-canvas-accent" 
                      : index <= historyIndex 
                        ? "bg-canvas-primary" 
                        : "bg-muted"
                  )}
                  onClick={() => setHistoryIndex(index)}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {historyIndex + 1} of {history.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Image Display */}
        <div className="relative bg-muted/20 min-h-[400px] flex items-center justify-center p-4">
          <img
            src={currentAsset.src}
            alt={currentAsset.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Quick Actions */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickEdit('remove-bg')}
                disabled={isProcessing}
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Background
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleQuickEdit('upscale')}
                disabled={isProcessing}
                className="justify-start"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Upscale Image
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleQuickEdit('enhance-color')}
                disabled={isProcessing}
                className="justify-start"
              >
                <Palette className="h-4 w-4 mr-2" />
                Enhance Colors
              </Button>
            </div>
          </div>

          {/* Advanced Editing */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Advanced Editing</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode('remove');
                  setIsEditing(true);
                }}
                disabled={isProcessing}
                className="w-full justify-start"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Remove Objects
              </Button>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode('add');
                    setIsEditing(true);
                  }}
                  disabled={isProcessing}
                  className="w-full justify-start"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Add Objects
                </Button>
                
                {editMode === 'add' && (
                  <Textarea
                    placeholder="Describe what you want to add (e.g., 'a red apple', 'beautiful flowers')"
                    value={objectInstruction}
                    onChange={(e) => setObjectInstruction(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Asset Actions */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Asset Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
            </div>
          </div>

          {/* Asset Info */}
          <Card className="bg-canvas-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(currentAsset.createdAt).toLocaleDateString()}</span>
                </div>
                {currentAsset.meta?.provider && (
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <Badge variant="secondary" className="text-xs">
                      {currentAsset.meta.provider}
                    </Badge>
                  </div>
                )}
                {currentAsset.derivedFrom && (
                  <div className="flex justify-between">
                    <span>Derived from:</span>
                    <span className="text-xs">Original asset</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drawing Overlay */}
      {isEditing && (
        <DrawingOverlay
          imageUrl={currentAsset.src}
          mode={editMode}
          onMaskComplete={handleMaskComplete}
          onCancel={() => setIsEditing(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}