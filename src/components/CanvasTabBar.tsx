import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Clock } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { CanvasCloseButton } from '@/components/ui/canvas-delete';
import { cn } from '@/lib/utils';

export const CanvasTabBar: React.FC = () => {
  const { canvases, activeCanvas, setActiveCanvas, createCanvas } = useAppStore();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedCanvases = canvases.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex items-center space-x-1 px-4 py-2 bg-sidebar-bg border-b border-border overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
      {/* Canvas Tabs */}
      {sortedCanvases.map((canvas) => (
        <div
          key={canvas.id}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group min-w-0 flex-shrink-0",
            activeCanvas === canvas.id
              ? "bg-primary/10 border border-primary/20 text-primary shadow-sm"
              : "bg-muted/50 hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveCanvas(canvas.id)}
        >
          {/* Canvas Preview */}
          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
            {canvas.asset?.src ? (
              <img 
                src={canvas.asset.src} 
                alt={canvas.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 rounded" />
            )}
          </div>

          {/* Canvas Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium truncate max-w-[120px]">
                {canvas.name}
              </span>
              <Badge 
                variant="outline" 
                className="text-xs h-5 px-1.5"
              >
                {canvas.type}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(canvas.createdAt)}
            </div>
          </div>

          {/* Close Button */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <CanvasCloseButton
              canvasId={canvas.id}
              canvasName={canvas.name}
              className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
            />
          </div>
        </div>
      ))}

      {/* Add New Canvas Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => createCanvas('image')}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50"
      >
        <Plus className="h-4 w-4 mr-1" />
        New
      </Button>

      {/* Clear All Canvases (when multiple exist) */}
      {canvases.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // This would trigger a confirmation dialog
            console.log('Clear all canvases');
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};