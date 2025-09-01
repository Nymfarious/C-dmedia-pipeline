import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Video, 
  Music, 
  Plus,
  Grid3X3,
  Save,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';
import { ProjectManagementModal } from './ProjectManagementModal';

interface LeftSidebarProps {
  canvases: Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    asset?: Asset;
    createdAt: number;
  }>;
  activeCanvas: string | null;
  onCreateCanvas: (type: 'image' | 'video' | 'audio') => void;
  onSelectCanvas: (id: string) => void;
  onLoadAssetToCanvas?: (asset: Asset) => void;
  onClearWorkspace?: () => void;
  onLoadProject?: (assets: Record<string, Asset>, currentAssetId?: string) => void;
  onOpenAIModal?: () => void;
}

export function LeftSidebar({ 
  canvases, 
  activeCanvas, 
  onCreateCanvas, 
  onSelectCanvas, 
  onLoadAssetToCanvas,
  onClearWorkspace,
  onLoadProject,
  onOpenAIModal
}: LeftSidebarProps) {
  const assets = useAppStore((state) => state.assets);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // Get recent assets for recent projects
  const recentAssets = Object.values(assets)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  const handleNewProject = () => {
    if (onClearWorkspace) {
      onClearWorkspace();
    }
  };

  const handleProjectLoad = (assets: Record<string, Asset>, currentAssetId?: string) => {
    if (onLoadProject) {
      onLoadProject(assets, currentAssetId);
    }
  };
  return (
    <div className="w-64 border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Create Canvas Section */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Create Canvas</h3>
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-3 bg-background hover:bg-muted"
              onClick={() => onCreateCanvas('image')}
            >
              <Image className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium text-foreground">Image Canvas</div>
                <div className="text-xs text-muted-foreground">Generate, edit, enhance</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-3 bg-background hover:bg-muted"
              onClick={() => onCreateCanvas('video')}
            >
              <Video className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium text-foreground">Video Canvas</div>
                <div className="text-xs text-muted-foreground">Image to video, animate</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-3 bg-background hover:bg-muted"
              onClick={() => onCreateCanvas('audio')}
            >
              <Music className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium text-foreground">Audio Canvas</div>
                <div className="text-xs text-muted-foreground">Text to speech, sound FX</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Access Section */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Quick Access</h3>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-9 p-2 text-primary hover:text-primary hover:bg-primary/10"
              onClick={onOpenAIModal}
            >
              <Sparkles className="h-4 w-4 mr-3" />
              AI Generation
            </Button>
            <Button variant="ghost" className="w-full justify-start h-9 p-2">
              <Grid3X3 className="h-4 w-4 mr-3" />
              AI Gallery
            </Button>
            <Button variant="ghost" className="w-full justify-start h-9 p-2">
              <Save className="h-4 w-4 mr-3" />
              Saved Projects
            </Button>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Recent Projects</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentAssets.length > 0 ? recentAssets.map((asset) => (
              <Card 
                key={asset.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onLoadAssetToCanvas?.(asset)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-3">
                    {asset.src && (
                      <img 
                        src={asset.src} 
                        alt={asset.name}
                        className="w-full h-20 rounded object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground truncate">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </div>
                      {asset.meta?.prompt && (
                        <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {asset.meta.prompt}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs w-fit">
                        {asset.type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center text-muted-foreground py-6">
                <div className="text-sm">No recent projects</div>
                <div className="text-xs">Generate some images to see them here</div>
              </div>
            )}
          </div>
        </div>

        {/* Active Canvases */}
        {canvases.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Your Canvases</h3>
            <div className="space-y-2">
              {canvases.map((canvas) => (
                <Card 
                  key={canvas.id}
                  className={`cursor-pointer transition-colors ${
                    activeCanvas === canvas.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectCanvas(canvas.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      {canvas.type === 'image' && <Image className="h-4 w-4 text-primary" />}
                      {canvas.type === 'video' && <Video className="h-4 w-4 text-primary" />}
                      {canvas.type === 'audio' && <Music className="h-4 w-4 text-primary" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">{canvas.name}</div>
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

      {/* New Project Button */}
      <div className="mt-auto p-4">
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => setShowProjectModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <ProjectManagementModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={handleNewProject}
        onProjectLoad={handleProjectLoad}
      />
    </div>
  );
}