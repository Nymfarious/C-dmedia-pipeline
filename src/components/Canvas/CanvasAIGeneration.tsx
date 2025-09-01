import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, X } from 'lucide-react';
import { Asset } from '@/types/media';
import { CanvasImageGeneration } from './CanvasImageGeneration';
import useAppStore from '@/store/appStore';

interface CanvasAIGenerationProps {
  onAssetGenerated: (asset: Asset) => void;
}

export function CanvasAIGeneration({ onAssetGenerated }: CanvasAIGenerationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeTool, setActiveTool } = useAppStore();

  const handleComplete = (asset: Asset) => {
    onAssetGenerated(asset);
    setIsOpen(false);
    setActiveTool(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setActiveTool(null);
  };

  // Show AI generation panel when smart-select tool is active - integrate inline
  if (activeTool === 'smart-select' || isOpen) {
    return (
      <div className="absolute top-4 right-4 w-96 z-40">
        <CanvasImageGeneration
          onComplete={handleComplete}
          onCancel={handleCancel}
          className="max-h-[calc(100vh-8rem)] overflow-y-auto"
        />
      </div>
    );
  }

  return null;
}