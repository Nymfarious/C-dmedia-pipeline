import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wand2, Loader2, Download, X, Sparkles } from 'lucide-react';
import { FloatingCloseButton } from '@/components/ui/FloatingCloseButton';
import { Asset } from '@/types/media';
import { CanvasImageGeneration } from './CanvasImageGeneration';
import useAppStore from '@/store/appStore';

interface CanvasAIGenerationProps {
  onAssetGenerated: (asset: Asset) => void;
  onClose?: () => void;
  position?: { x: number; y: number };
  className?: string;
}

export function CanvasAIGeneration({ onAssetGenerated, onClose, position, className = "" }: CanvasAIGenerationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeTool, setActiveTool } = useAppStore();

  const handleComplete = (asset: Asset) => {
    onAssetGenerated(asset);
    setIsOpen(false);
    setActiveTool(null);
    onClose?.();
  };

  const handleCancel = () => {
    setIsOpen(false);
    setActiveTool(null);
    onClose?.();
  };

  // Show AI generation panel when smart-select tool is active - integrate inline
  if (activeTool === 'smart-select' || isOpen) {
    return (
      <Card 
        className={`relative w-full max-w-md mx-auto ${className}`}
        style={{
          left: position?.x,
          top: position?.y,
          transform: position ? 'none' : undefined,
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Generation
            </div>
            {(onClose || activeTool === 'smart-select') && (
              <FloatingCloseButton onClose={handleCancel} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CanvasImageGeneration
            onComplete={handleComplete}
            onCancel={handleCancel}
            className="max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          />
        </CardContent>
      </Card>
    );
  }

  return null;
}