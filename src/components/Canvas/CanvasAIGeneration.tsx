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

  // Show AI generation panel when smart-select tool is active
  if (activeTool === 'smart-select' || isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
          <CanvasImageGeneration
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  return null;
}