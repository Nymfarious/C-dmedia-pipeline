import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Upload, Plus, Sparkles } from 'lucide-react';
import { ImageCanvas } from '@/components/Canvas/ImageCanvas';
import { CanvasAIGeneration } from '@/components/Canvas/CanvasAIGeneration';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';

interface Canvas {
  id: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  asset?: Asset;
  createdAt: number;
}

interface CenterWorkspaceProps {
  currentCanvas: Canvas | null;
  onCanvasAssetUpdate: (canvasId: string, asset: Asset) => void;
  onCreateCanvas: (type: 'image' | 'video' | 'audio') => void;
}

export function CenterWorkspace({ currentCanvas, onCanvasAssetUpdate, onCreateCanvas }: CenterWorkspaceProps) {
  const { assets, createCanvas, setActiveCanvas } = useAppStore();
  
  console.log('CenterWorkspace render - currentCanvas:', !!currentCanvas);
  if (currentCanvas) {
    console.log('CenterWorkspace - Canvas type:', currentCanvas.type, 'Asset:', !!currentCanvas.asset);
  }
  
  // Get recent generated assets (from both assets and gallery)
  const recentGeneratedAssets = Object.values(assets)
    .filter(asset => asset.meta?.provider || asset.category === 'generated')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const handleLoadAssetToCanvas = (asset: Asset) => {
    console.log('CenterWorkspace - Loading asset to canvas:', asset.id, asset.name);
    const canvasId = createCanvas('image', asset);
    console.log('CenterWorkspace - Created canvas:', canvasId);
    setActiveCanvas(canvasId);
    console.log('CenterWorkspace - Set active canvas:', canvasId);
  };

  if (!currentCanvas) {
    return (
      <div className="flex-1 bg-stage-bg p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Create Canvas Section */}
          <Card className="bg-card border-border">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Create Your Canvas</h3>
              <p className="text-muted-foreground mb-6">
                Start creating amazing content with AI-powered tools
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button 
                  className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90 text-white font-medium"
                  onClick={() => onCreateCanvas('image')}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-border hover:bg-muted"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import File
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Generations Section */}
          {recentGeneratedAssets.length > 0 && (
            <Card className="bg-card border-border">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Recent Generations</h3>
                  <Badge variant="secondary" className="text-xs">
                    {recentGeneratedAssets.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {recentGeneratedAssets.map((asset) => (
                    <Card 
                      key={asset.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-border group"
                      onClick={() => handleLoadAssetToCanvas(asset)}
                    >
                      <div className="p-3">
                        <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                          {asset.src && (
                            <img 
                              src={asset.src} 
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </p>
                          {asset.meta?.prompt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {asset.meta.prompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  console.log('CenterWorkspace - Rendering active canvas:', currentCanvas.type, currentCanvas.asset?.id);

  return (
    <div className="flex-1 bg-stage-bg p-4">
      {currentCanvas.type === 'image' && (
        <ImageCanvas 
          asset={currentCanvas.asset}
          onAssetUpdate={(asset) => {
            console.log('CenterWorkspace - Canvas asset update:', asset.id);
            onCanvasAssetUpdate(currentCanvas.id, asset);
          }}
        />
      )}
      
      {currentCanvas.type === 'video' && (
        <Card className="h-full flex items-center justify-center bg-card border-border">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Video Canvas</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        </Card>
      )}
      
      {currentCanvas.type === 'audio' && (
        <Card className="h-full flex items-center justify-center bg-card border-border">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Audio Canvas</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        </Card>
      )}
      
      {/* AI Generation Panel */}
      <CanvasAIGeneration
        onAssetGenerated={(asset) => {
          if (currentCanvas) {
            onCanvasAssetUpdate(currentCanvas.id, asset);
          }
        }}
      />
    </div>
  );
}