import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function FloatingToolExit() {
  const { activeTool, exitActiveTool } = useAppStore();

  if (activeTool === 'select') {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="bg-background/95 backdrop-blur border rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <ArrowLeft className="h-3 w-3" />
          Press ESC to exit
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={exitActiveTool}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Exit {activeTool === 'inpaint' ? 'Inpainting' : 'Tool'}
        </Button>
      </div>
    </div>
  );
}