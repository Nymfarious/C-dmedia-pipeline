import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Music, MoreVertical, Trash2, Eye, Edit, Plus, X, Clock, Palette } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { cn } from '@/lib/utils';

export const CanvasManager: React.FC = () => {
  const { canvases, activeCanvas, setActiveCanvas, deleteCanvas, deleteAllCanvases, createCanvas } = useAppStore();
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const getCanvasIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <Palette className="h-4 w-4" />;
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

  const sortedCanvases = canvases.sort((a, b) => b.createdAt - a.createdAt);
  const imageCanvases = sortedCanvases.filter(c => c.type === 'image');
  const videoCanvases = sortedCanvases.filter(c => c.type === 'video');
  const audioCanvases = sortedCanvases.filter(c => c.type === 'audio');

  const renderCanvasList = (canvasList: typeof canvases, type?: string) => (
    <div className="space-y-2">
      {canvasList.map((canvas) => (
        <Card
          key={canvas.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md group border",
            activeCanvas === canvas.id 
              ? "ring-2 ring-primary shadow-md bg-primary/5 border-primary/50" 
              : "hover:border-primary/30 border-border"
          )}
          onClick={() => setActiveCanvas(canvas.id)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Canvas Preview */}
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-lg border flex items-center justify-center",
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
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getCanvasTypeColor(canvas.type))}
                    >
                      {canvas.type}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(canvas.createdAt)}
                  </div>
                </div>
              </div>

              {/* Canvas Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCanvas(canvas.id);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                
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
                        setActiveCanvas(canvas.id);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Open Canvas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Canvas
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{canvas.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCanvas(canvas.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Canvas
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {canvasList.length === 0 && (
        <div className="text-center py-8">
          <div className={cn(
            "w-12 h-12 rounded-lg border mx-auto mb-3 flex items-center justify-center",
            type ? getCanvasTypeColor(type) : "bg-muted"
          )}>
            {type ? getCanvasIcon(type) : <Palette className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            No {type || ''} canvases yet
          </p>
          {type && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => createCanvas(type as 'image' | 'video' | 'audio')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create {type} canvas
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Canvas Manager</CardTitle>
          <div className="flex items-center space-x-2">
            {canvases.length > 0 && (
              <>
                <Badge variant="secondary">
                  {canvases.length} canvas{canvases.length !== 1 ? 'es' : ''}
                </Badge>
                <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Canvases</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all {canvases.length} canvas{canvases.length !== 1 ? 'es' : ''}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteAllCanvases();
                          setShowDeleteAll(false);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Canvas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => createCanvas('image')}>
                  <Image className="h-4 w-4 mr-2" />
                  Image Canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createCanvas('video')}>
                  <Video className="h-4 w-4 mr-2" />
                  Video Canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => createCanvas('audio')}>
                  <Music className="h-4 w-4 mr-2" />
                  Audio Canvas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[calc(100%-5rem)] p-0">
        {canvases.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Palette className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No canvases yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first canvas to start working on your project
            </p>
            <div className="flex flex-col space-y-2 max-w-xs mx-auto">
              <Button onClick={() => createCanvas('image')}>
                <Image className="h-4 w-4 mr-2" />
                Create Image Canvas
              </Button>
              <Button variant="outline" onClick={() => createCanvas('video')}>
                <Video className="h-4 w-4 mr-2" />
                Create Video Canvas
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({canvases.length})</TabsTrigger>
                <TabsTrigger value="image">Images ({imageCanvases.length})</TabsTrigger>
                <TabsTrigger value="video">Video ({videoCanvases.length})</TabsTrigger>
                <TabsTrigger value="audio">Audio ({audioCanvases.length})</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full px-6 pb-6">
                <TabsContent value="all" className="mt-4">
                  {renderCanvasList(sortedCanvases)}
                </TabsContent>
                <TabsContent value="image" className="mt-4">
                  {renderCanvasList(imageCanvases, 'image')}
                </TabsContent>
                <TabsContent value="video" className="mt-4">
                  {renderCanvasList(videoCanvases, 'video')}
                </TabsContent>
                <TabsContent value="audio" className="mt-4">
                  {renderCanvasList(audioCanvases, 'audio')}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};