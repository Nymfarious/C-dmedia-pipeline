import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ColorAdjustmentPanel } from './Canvas/ColorAdjustmentPanel';
import { 
  Scissors, 
  ArrowUp, 
  Palette,
  Edit3,
  Image
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';

interface EditPanelProps {
  selectedAsset: Asset | null;
  onEditComplete: (params: ImageEditParams) => Promise<void>;
  className?: string;
}

// Essential editing operations only

export function EditPanel({ selectedAsset, onEditComplete, className }: EditPanelProps) {
  const [activeOperation, setActiveOperation] = useState<'crop' | 'resize' | 'color' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Resize parameters
  const [resizeScale, setResizeScale] = useState([200]);
  
  // Crop parameters  
  const [cropRatio, setCropRatio] = useState('1:1');

  if (!selectedAsset) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select an image to start editing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleResize = async () => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'upscale',
        provider: 'replicate.upscale',
        scale: resizeScale[0] / 100
      };
      
      await onEditComplete(params);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = async () => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'smart-crop',
        provider: 'replicate.smart-crop',
        cropSettings: {
          aspectRatio: cropRatio,
          preset: 'auto',
          x: 0,
          y: 0,
          width: 100,
          height: 100
        }
      };
      
      await onEditComplete(params);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColorAdjustment = async (adjustments: any) => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'color-enhancement',
        provider: 'replicate.color-enhancement',
        ...adjustments
      };
      
      await onEditComplete(params);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Essential Edits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={activeOperation === 'crop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveOperation(activeOperation === 'crop' ? null : 'crop')}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <Scissors className="h-4 w-4" />
            <span className="text-xs">Crop</span>
          </Button>
          <Button
            variant={activeOperation === 'resize' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveOperation(activeOperation === 'resize' ? null : 'resize')}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="text-xs">Resize</span>
          </Button>
          <Button
            variant={activeOperation === 'color' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveOperation(activeOperation === 'color' ? null : 'color')}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <Palette className="h-4 w-4" />
            <span className="text-xs">Color</span>
          </Button>
        </div>

        {/* Operation Controls */}
        {activeOperation === 'crop' && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <div className="grid grid-cols-3 gap-2">
                {['1:1', '16:9', '9:16'].map(ratio => (
                  <Button
                    key={ratio}
                    variant={cropRatio === ratio ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCropRatio(ratio)}
                  >
                    {ratio}
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleCrop}
              disabled={isProcessing}
              className="w-full"
              size="sm"
            >
              {isProcessing ? 'Processing...' : 'Apply Smart Crop'}
            </Button>
          </div>
        )}

        {activeOperation === 'resize' && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Scale: {resizeScale[0]}%</Label>
              <Slider
                value={resizeScale}
                onValueChange={setResizeScale}
                min={50}
                max={400}
                step={25}
              />
            </div>
            <Button 
              onClick={handleResize}
              disabled={isProcessing}
              className="w-full"
              size="sm"
            >
              {isProcessing ? 'Processing...' : 'Apply Resize'}
            </Button>
          </div>
        )}

        {activeOperation === 'color' && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <ColorAdjustmentPanel onAdjustment={handleColorAdjustment} />
          </div>
        )}

        {/* AI Generation Note */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
          For AI generation and advanced editing, use the Smart Select tool in the toolbar
        </div>
      </CardContent>
    </Card>
  );
}