import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Music, 
  Plus,
  Grid3X3,
  Layers,
  Wand2,
  Settings
} from 'lucide-react';
import { ImageCanvas } from '@/components/Canvas/ImageCanvas';
import { Asset } from '@/types/media';
import { ApiKeySettings } from '@/components/Settings/ApiKeySettings';

export function Dashboard() {
  const [canvases, setCanvases] = useState<Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    asset?: Asset;
    createdAt: number;
  }>>([]);
  
  const [activeCanvas, setActiveCanvas] = useState<string | null>(null);

  const createCanvas = (type: 'image' | 'video' | 'audio') => {
    const newCanvas = {
      id: crypto.randomUUID(),
      type,
      name: `New ${type} canvas`,
      createdAt: Date.now(),
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvas(newCanvas.id);
  };

  const updateCanvasAsset = (canvasId: string, asset: Asset) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId 
        ? { ...canvas, asset }
        : canvas
    ));
  };

  const currentCanvas = canvases.find(c => c.id === activeCanvas);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Frame Fuser</h1>
            <p className="text-muted-foreground">AI-powered media creation studio</p>
          </div>
          <div className="flex gap-2">
            <ApiKeySettings />
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas List Sidebar */}
        <div className="w-64 border-r p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Create Canvas</h3>
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-3"
                  onClick={() => createCanvas('image')}
                >
                  <Image className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Image Canvas</div>
                    <div className="text-xs text-muted-foreground">Generate, edit, enhance</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-3"
                  onClick={() => createCanvas('video')}
                >
                  <Video className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Video Canvas</div>
                    <div className="text-xs text-muted-foreground">Image to video, animate</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-3"
                  onClick={() => createCanvas('audio')}
                >
                  <Music className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Audio Canvas</div>
                    <div className="text-xs text-muted-foreground">Text to speech, sound FX</div>
                  </div>
                </Button>
              </div>
            </div>

            {canvases.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Your Canvases</h3>
                <div className="space-y-2">
                  {canvases.map((canvas) => (
                    <Card 
                      key={canvas.id}
                      className={`cursor-pointer transition-colors ${
                        activeCanvas === canvas.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setActiveCanvas(canvas.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          {canvas.type === 'image' && <Image className="h-4 w-4" />}
                          {canvas.type === 'video' && <Video className="h-4 w-4" />}
                          {canvas.type === 'audio' && <Music className="h-4 w-4" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{canvas.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(canvas.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {canvas.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 p-4">
          {currentCanvas ? (
            <div className="h-full">
              {currentCanvas.type === 'image' && (
                <ImageCanvas 
                  asset={currentCanvas.asset}
                  onAssetUpdate={(asset) => updateCanvasAsset(currentCanvas.id, asset)}
                />
              )}
              
              {currentCanvas.type === 'video' && (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Video Canvas</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </Card>
              )}
              
              {currentCanvas.type === 'audio' && (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Audio Canvas</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground max-w-md">
                <Layers className="h-16 w-16 mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Welcome to Frame Fuser</h3>
                <p className="mb-6">
                  Create a new canvas to start generating and editing images, videos, and audio with AI.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => createCanvas('image')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Image Canvas
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}