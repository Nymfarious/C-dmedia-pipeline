import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanvasManager } from '@/components/CanvasManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickCanvasDelete } from '@/components/ui/canvas-delete';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Image, 
  Video, 
  Music, 
  Plus,
  Grid3X3,
  Save,
  FolderOpen,
  Sparkles,
  Wand2,
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  GripVertical
} from 'lucide-react';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';
import { ProjectManagementModal } from './ProjectManagementModal';
import { LocalFileImport } from './workspace/LocalFileImport';
import { cn } from '@/lib/utils';

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
  const { deleteCanvas, setActiveCanvas } = useAppStore();
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  
  // Enhanced canvas management
  const emptyCanvases = canvases.filter(canvas => !canvas.asset);
  const hasEmptyCanvases = emptyCanvases.length > 0;
  
  const handleBulkDeleteEmpty = () => {
    emptyCanvases.forEach(canvas => deleteCanvas(canvas.id));
  };
  
  const getCanvasIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <Grid3X3 className="h-4 w-4" />;
    }
  };

  const getCanvasTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'video': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'audio': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get recent assets for recent projects
  const recentAssets = Object.values(assets)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const sortedCanvases = canvases.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-80 bg-sidebar-bg border-r border-border flex flex-col h-full">
      <Tabs defaultValue="canvases" className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="canvases">Canvases</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="canvases" className="flex-1 p-0 m-0">
          <div className="flex flex-col h-full">
            {/* Quick Create Section */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Quick Create</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectModal(true)}
                  className="text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Projects
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateCanvas('image')}
                  className="flex flex-col h-16 text-xs"
                >
                  <Image className="h-4 w-4 mb-1" />
                  Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateCanvas('video')}
                  className="flex flex-col h-16 text-xs"
                >
                  <Video className="h-4 w-4 mb-1" />
                  Video
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateCanvas('audio')}
                  className="flex flex-col h-16 text-xs"
                >
                  <Music className="h-4 w-4 mb-1" />
                  Audio
                </Button>
              </div>
            </div>

            {/* Active Canvases */}
            <div className="flex-1 overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">
                      Active Canvases ({canvases.length})
                    </h3>
                    {hasEmptyCanvases && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkDeleteEmpty}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear Empty ({emptyCanvases.length})
                      </Button>
                    )}
                  </div>
                  {onOpenAIModal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenAIModal}
                      className="text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 max-h-[400px]">
                <div className="space-y-2 pb-4">
                  {sortedCanvases.map((canvas) => (
                    <Card
                      key={canvas.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md group border",
                        activeCanvas === canvas.id 
                          ? "ring-2 ring-primary shadow-md bg-primary/5 border-primary/50" 
                          : "hover:border-primary/30 border-border"
                      )}
                      onClick={() => onSelectCanvas(canvas.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          {/* Canvas Preview */}
                          <div className="relative">
                            <div className={cn(
                              "w-10 h-10 rounded-lg border flex items-center justify-center",
                              getCanvasTypeColor(canvas.type)
                            )}>
                              {canvas.asset?.src ? (
                                <img 
                                  src={canvas.asset.src} 
                                  alt={canvas.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                getCanvasIcon(canvas.type)
                              )}
                            </div>
                            {activeCanvas === canvas.id && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                            )}
                          </div>

                          {/* Canvas Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-foreground truncate">
                                {canvas.name}
                              </h3>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getCanvasTypeColor(canvas.type))}
                                >
                                  {canvas.type}
                                </Badge>
                                {!canvas.asset && (
                                  <Badge variant="secondary" className="text-xs">
                                    Empty
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(canvas.createdAt)}
                            </div>
                          </div>

                          {/* Canvas Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectCanvas(canvas.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Open Canvas
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCanvas(canvas.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Canvas
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {canvases.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <Grid3X3 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">No canvases yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateCanvas('image')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create first canvas
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Recent Assets Quick Load - Draggable to Timeline */}
            {recentAssets.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Recent Assets</h3>
                  <LocalFileImport
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    maxFiles={7}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Import
                  </LocalFileImport>
                </div>
                <div className="space-y-2">
                  {recentAssets.slice(0, 3).map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        const dragData = JSON.stringify({
                          id: asset.id,
                          name: asset.name,
                          type: asset.type,
                          url: asset.src,
                          thumbnail: asset.src,
                          duration: 5,
                        });
                        e.dataTransfer.setData('application/json', dragData);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing transition-colors group"
                      onClick={() => onLoadAssetToCanvas?.(asset)}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src={asset.src}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {asset.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.type} • Drag to timeline
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="manager" className="flex-1 p-4 m-0">
          <CanvasManager />
        </TabsContent>
      </Tabs>

      {/* Project Management Modal */}
      <ProjectManagementModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={onClearWorkspace || (() => {})}
        onProjectLoad={onLoadProject || (() => {})}
      />
    </div>
  );
}