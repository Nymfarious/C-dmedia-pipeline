import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  motionStrength: number;
  style?: string;
  seed?: number;
  enableAudio: boolean;
  timestamp: string;
  assetId: string;
}

interface VideoHistoryPanelProps {
  isActive: boolean;
  onClose: () => void;
  onReuse: (item: HistoryItem) => void;
}

export const VideoHistoryPanel: React.FC<VideoHistoryPanelProps> = ({ 
  isActive, 
  onClose, 
  onReuse 
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isActive) {
      loadHistory();
    }
  }, [isActive]);

  const loadHistory = () => {
    const saved = localStorage.getItem('videoGenerationHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('videoGenerationHistory');
    setHistory([]);
    toast.success('Generation history cleared');
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('videoGenerationHistory', JSON.stringify(updated));
    toast.success('History item removed');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!isActive) return null;

  return (
    <Card className="absolute top-16 right-4 z-50 w-80 bg-background border-border shadow-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Generation History</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              disabled={history.length === 0}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No generation history yet</p>
              <p className="text-xs">Generate videos to see them here</p>
            </div>
          ) : (
            history.map((item) => (
              <Card key={item.id} className="p-3 bg-card border-border hover:bg-muted/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {item.prompt}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHistoryItem(item.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.duration}s
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {item.aspectRatio}
                    </Badge>
                    {item.style && (
                      <Badge variant="outline" className="text-xs">
                        {item.style}
                      </Badge>
                    )}
                    {item.enableAudio && (
                      <Badge variant="outline" className="text-xs">
                        Audio
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(item.timestamp)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onReuse(item);
                        onClose();
                        toast.success('Settings applied from history');
                      }}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reuse
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};