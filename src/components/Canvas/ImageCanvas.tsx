import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  Edit3, 
  Scissors, 
  ZoomIn, 
  RotateCw, 
  Download,
  Layers,
  Undo2,
  Redo2
} from 'lucide-react';
import { Asset } from '@/types/media';
import { useToast } from '@/hooks/use-toast';

interface ImageCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}

export function ImageCanvas({ asset, onAssetUpdate }: ImageCanvasProps) {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [history, setHistory] = useState<Asset[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const tools = [
    { id: 'select', label: 'Select', icon: Edit3 },
    { id: 'generate', label: 'Generate', icon: Wand2 },
    { id: 'edit', label: 'Edit', icon: Edit3 },
    { id: 'remove-bg', label: 'Remove BG', icon: Scissors },
    { id: 'upscale', label: 'Upscale', icon: ZoomIn },
    { id: 'rotate', label: 'Rotate', icon: RotateCw },
  ];

  const addToHistory = useCallback((newAsset: Asset) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAsset);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

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

  const handleToolAction = async (toolId: string) => {
    if (!asset) {
      toast({
        title: "No Asset",
        description: "Please select or generate an image first",
        variant: "destructive",
      });
      return;
    }

    setSelectedTool(toolId);
    
    switch (toolId) {
      case 'generate':
        // Trigger generation pipeline
        toast({
          title: "Generate Tool",
          description: "Opening generation pipeline...",
        });
        break;
        
      case 'edit':
        // Trigger edit pipeline
        toast({
          title: "Edit Tool", 
          description: "Opening edit pipeline...",
        });
        break;
        
      case 'remove-bg':
        await handleBackgroundRemoval();
        break;
        
      case 'upscale':
        await handleUpscale();
        break;
        
      case 'rotate':
        await handleRotate();
        break;
    }
  };

  const handleBackgroundRemoval = async () => {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure Replicate API key in settings",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "cjwbw/rembg",
          input: {
            image: asset?.src
          }
        }),
      });

      const prediction = await response.json();
      
      toast({
        title: "Background Removal",
        description: "Processing image...",
      });
      
      // Poll for result and update asset
      // Implementation would continue here...
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove background",
        variant: "destructive",
      });
    }
  };

  const handleUpscale = async () => {
    toast({
      title: "Upscale",
      description: "Upscaling image...",
    });
    // Implementation for upscaling
  };

  const handleRotate = () => {
    if (!asset) return;
    
    // Simple 90-degree rotation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.rotate(Math.PI / 2);
        addToHistory(asset);
        toast({
          title: "Rotated",
          description: "Image rotated 90 degrees",
        });
      }
    }
  };

  const downloadAsset = () => {
    if (!asset) return;
    
    const link = document.createElement('a');
    link.href = asset.src;
    link.download = asset.name || 'image.png';
    link.click();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Canvas</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsset}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {/* Toolbar */}
        <div className="p-3 border-b">
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolAction(tool.id)}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {tool.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4 flex-1 flex items-center justify-center bg-muted/20">
          {asset ? (
            <div className="relative max-w-full max-h-full">
              <img
                src={asset.src}
                alt={asset.name}
                className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
              <Badge className="absolute top-2 left-2">
                <Layers className="h-3 w-3 mr-1" />
                {asset.meta?.provider || 'Unknown'}
              </Badge>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No image selected</p>
              <p className="text-sm">Use the generation tools to create or upload an image</p>
            </div>
          )}
        </div>

        {/* Asset Info */}
        {asset && (
          <div className="p-3 border-t bg-muted/20">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions:</span>
                <span>{asset.meta?.width} × {asset.meta?.height}</span>
              </div>
              {asset.meta?.prompt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prompt:</span>
                  <span className="truncate max-w-[200px]">{asset.meta.prompt}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}