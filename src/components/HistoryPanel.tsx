import React from 'react';
import { RotateCcw, RotateCw, Clock, Trash2 } from 'lucide-react';

interface HistoryAction {
  type: string;
  time: string;
  [key: string]: any;
}

interface HistoryPanelProps {
  history: HistoryAction[];
  historyIndex: number;
}

export function HistoryPanel({ history, historyIndex }: HistoryPanelProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'upload': return '📁';
      case 'ai_generation': return '✨';
      case 'remove_bg': return '🗑️';
      case 'enhance': return '⚡';
      case 'style_transfer': return '🎨';
      case 'add_asset': return '➕';
      case 'brush_stroke': return '🖌️';
      case 'crop': return '✂️';
      case 'resize': return '📏';
      default: return '📝';
    }
  };

  const getActionDescription = (action: HistoryAction) => {
    switch (action.type) {
      case 'upload':
        return 'Uploaded file';
      case 'ai_generation':
        return `Generated: ${action.prompt?.slice(0, 30)}...`;
      case 'remove_bg':
        return 'Removed background';
      case 'enhance':
        return 'Enhanced image';
      case 'style_transfer':
        return 'Applied style transfer';
      case 'add_asset':
        return `Added ${action.asset?.type || 'asset'}`;
      case 'brush_stroke':
        return 'Brush stroke';
      case 'crop':
        return 'Cropped image';
      case 'resize':
        return 'Resized canvas';
      default:
        return action.type;
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">History</h3>
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 hover:bg-muted rounded-md disabled:opacity-50"
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button 
            className="p-1 hover:bg-muted rounded-md disabled:opacity-50"
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No history yet</p>
          <p className="text-xs">Actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {history.map((action, index) => (
            <div
              key={index}
              className={`group p-2 rounded-md border transition-colors ${
                index === historyIndex
                  ? 'border-primary bg-primary/10'
                  : index < historyIndex
                  ? 'border-border'
                  : 'border-border opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1 min-w-0">
                  <div className="mr-2 text-sm mt-0.5">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getActionDescription(action)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {action.time}
                    </div>
                  </div>
                </div>
                
                <button
                  className="p-1 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from history"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <button className="w-full py-2 px-3 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 text-sm flex items-center justify-center">
            <Trash2 className="mr-1 h-4 w-4" />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}