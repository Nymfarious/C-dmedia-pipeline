import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ZoomIn, ZoomOut, RotateCcw, Grid3x3, Maximize, Play, Download } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { cn } from '@/lib/utils';
import { downloadBlob, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';

export function Stage() {
  const { assets, selectedAssetIds, steps, exportAssets } = useAppStore();
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);

  // Get the currently focused asset (last selected or most recent step output)
  const focusedAsset = (() => {
    if (selectedAssetIds.length > 0) {
      return assets[selectedAssetIds[selectedAssetIds.length - 1]];
    }
    
    // Find the most recent completed step's output
    const completedSteps = Object.values(steps)
      .filter(step => step.status === 'done' && step.outputAssetId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (completedSteps.length > 0) {
      return assets[completedSteps[0].outputAssetId!];
    }
    
    // Fallback to any asset
    const assetArray = Object.values(assets);
    return assetArray.length > 0 ? assetArray[0] : null;
  })();

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  const handleExportFocused = async () => {
    if (!focusedAsset) return;
    
    try {
      const exports = await exportAssets([focusedAsset.id]);
      if (exports.length > 0) {
        const { name, blob } = exports[0];
        const extension = getFileExtensionFromBlob(blob);
        downloadBlob(blob, `${name}.${extension}`);
        toast.success('Asset exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export asset');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="h-full bg-stage-bg flex flex-col">
      {/* Stage Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Stage</h2>
            {focusedAsset && (
              <Badge variant="outline" className="text-xs">
                {focusedAsset.type}
              </Badge>
            )}
          </div>
          
          {/* Stage Controls */}
          <div className="flex items-center gap-2">
            {focusedAsset && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportFocused}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Asset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={cn(showGrid && "bg-primary/10 border-primary")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleResetZoom}>
                <span className="text-xs font-medium min-w-[3rem]">{zoom}%</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 p-6 overflow-auto">
        {focusedAsset ? (
          <div className="h-full flex items-center justify-center relative">
            {/* Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}
            
            {/* Asset Display */}
            <Card className="bg-background border-2 border-dashed border-border shadow-card max-w-full max-h-full">
              <CardContent className="p-4">
                <div className="relative">
                  {/* Asset Preview */}
                  <div 
                    className="relative overflow-hidden rounded-lg bg-muted"
                    style={{ transform: `scale(${zoom / 100})` }}
                  >
                    <img
                      src={focusedAsset.src}
                      alt={focusedAsset.name || 'Focused asset'}
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                    
                    {/* Animation Indicator */}
                    {focusedAsset.type === 'animation' && (
                      <div className="absolute top-4 right-4">
                        <Button variant="accent" size="sm">
                          <Play className="h-4 w-4" />
                          Play
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Asset Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <Card className="bg-background/90 backdrop-blur-sm border border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground text-sm">
                              {focusedAsset.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {focusedAsset.meta?.width && focusedAsset.meta?.height 
                                ? `${focusedAsset.meta.width} × ${focusedAsset.meta.height}` 
                                : 'Unknown dimensions'
                              }
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            {focusedAsset.meta?.provider && (
                              <Badge variant="secondary" className="text-xs">
                                {focusedAsset.meta.provider}
                              </Badge>
                            )}
                            {focusedAsset.derivedFrom && (
                              <Badge variant="outline" className="text-xs border-accent text-accent">
                                Derived
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Additional metadata */}
                        {focusedAsset.meta && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {focusedAsset.meta.prompt && (
                              <span className="text-xs text-muted-foreground italic">
                                "{focusedAsset.meta.prompt.slice(0, 50)}..."
                              </span>
                            )}
                            {focusedAsset.meta.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {(focusedAsset.meta.duration / 1000).toFixed(1)}s
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="border-2 border-dashed border-border bg-card/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Maximize className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Asset Selected
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select an asset from the gallery or create a new one to view it here
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}