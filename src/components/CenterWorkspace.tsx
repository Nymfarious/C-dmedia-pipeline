import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Plus } from 'lucide-react';
import { ImageCanvas } from '@/components/Canvas/ImageCanvas';
import { Asset } from '@/types/media';

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
  if (!currentCanvas) {
    return (
      <div className="flex-1 bg-stage-bg flex items-center justify-center p-8">
        <Card className="max-w-md w-full bg-card border-border">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Create Your Canvas</h3>
            <p className="text-muted-foreground mb-6">
              Start creating amazing content with AI-powered tools
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-white font-medium"
                onClick={() => onCreateCanvas('image')}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-border hover:bg-muted"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import File
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-stage-bg p-4">
      {currentCanvas.type === 'image' && (
        <ImageCanvas 
          asset={currentCanvas.asset}
          onAssetUpdate={(asset) => onCanvasAssetUpdate(currentCanvas.id, asset)}
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
    </div>
  );
}