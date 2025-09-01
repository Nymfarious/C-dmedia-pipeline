import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  Plus, 
  X, 
  ArrowRight,
  Shuffle,
  Settings,
  Wand2
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';
import useAppStore from '@/store/appStore';

interface AssetCombinerProps {
  onComplete: (params: ImageEditParams) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

type CombineMode = 'fusion' | 'collage' | 'blend' | 'composite';

const COMBINE_MODES = [
  { 
    key: 'fusion' as CombineMode, 
    name: 'AI Fusion', 
    description: 'Seamlessly blend images using AI',
    model: 'nano-banana-edit'
  },
  { 
    key: 'collage' as CombineMode, 
    name: 'Smart Collage', 
    description: 'Arrange images in an artistic layout',
    model: 'flux-dev'
  },
  { 
    key: 'blend' as CombineMode, 
    name: 'Style Blend', 
    description: 'Combine visual styles from multiple images',
    model: 'style-transfer'
  },
  { 
    key: 'composite' as CombineMode, 
    name: 'Composite', 
    description: 'Layer images with precise control',
    model: 'nano-banana'
  }
];

const COMPOSITION_STYLES = [
  'side by side', 'overlapping', 'mosaic', 'layered', 'seamless blend',
  'artistic collage', 'symmetric arrangement', 'dynamic composition'
];

export function AssetCombiner({ onComplete, onCancel, className }: AssetCombinerProps) {
  const { assets } = useAppStore();
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [mode, setMode] = useState<CombineMode>('fusion');
  const [instruction, setInstruction] = useState('');
  const [compositionStyle, setCompositionStyle] = useState('seamless blend');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced parameters
  const [blendStrength, setBlendStrength] = useState([0.7]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  const [steps, setSteps] = useState([20]);

  // Get available assets (images only)
  const availableAssets = Object.values(assets).filter(asset => 
    asset.type === 'image' && !selectedAssets.find(selected => selected.id === asset.id)
  );

  const handleAddAsset = (asset: Asset) => {
    if (selectedAssets.length < 6) { // Limit to 6 assets for performance
      setSelectedAssets(prev => [...prev, asset]);
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setSelectedAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const handleModeChange = (newMode: CombineMode) => {
    setMode(newMode);
    // Update default instruction based on mode
    const modeInfo = COMBINE_MODES.find(m => m.key === newMode);
    if (!instruction) {
      switch (newMode) {
        case 'fusion':
          setInstruction('Seamlessly blend these images into one cohesive artwork');
          break;
        case 'collage':
          setInstruction('Create an artistic collage from these images');
          break;
        case 'blend':
          setInstruction('Combine the visual styles of these images');
          break;
        case 'composite':
          setInstruction('Layer these images into a composite artwork');
          break;
      }
    }
  };

  const handleShuffle = () => {
    setSelectedAssets(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleApplyCombination = async () => {
    if (selectedAssets.length < 2) return;

    setIsProcessing(true);
    try {
      const modeInfo = COMBINE_MODES.find(m => m.key === mode);
      
      // Prepare multi-image input
      const imageUrls = selectedAssets.map(asset => asset.src);
      const combinedInstruction = `${instruction}. Composition style: ${compositionStyle}. Blend strength: ${blendStrength[0]}`;

      const params: ImageEditParams = {
        operation: 'multi-image-fusion',
        instruction: combinedInstruction,
        provider: `replicate.${modeInfo?.model || 'nano-banana-edit'}`,
        // Pass multiple images as array
        targetImageUrl: imageUrls[0], // Primary image
        referenceImageUrl: imageUrls[1], // Secondary image
        // Additional metadata for multi-image processing
        multiImageUrls: imageUrls,
        combineMode: mode,
        compositionStyle,
        strength: blendStrength[0],
        guidance_scale: guidanceScale[0],
        num_inference_steps: steps[0],
      };

      await onComplete(params);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDefaultInstruction = useCallback(() => {
    switch (mode) {
      case 'fusion':
        return 'Seamlessly blend these images into one cohesive artwork';
      case 'collage':
        return 'Create an artistic collage from these images';
      case 'blend':
        return 'Combine the visual styles of these images';
      case 'composite':
        return 'Layer these images into a composite artwork';
      default:
        return '';
    }
  }, [mode]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Asset Combiner
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label>Combination Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            {COMBINE_MODES.map(modeInfo => (
              <Button
                key={modeInfo.key}
                variant={mode === modeInfo.key ? "default" : "outline"}
                onClick={() => handleModeChange(modeInfo.key)}
                className="h-auto p-3 text-left"
              >
                <div>
                  <div className="font-medium text-sm">{modeInfo.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {modeInfo.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Selected Images ({selectedAssets.length}/6)</Label>
            {selectedAssets.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
              >
                <Shuffle className="h-4 w-4 mr-1" />
                Shuffle
              </Button>
            )}
          </div>
          
          {selectedAssets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select 2-6 images to combine</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {selectedAssets.map((asset, index) => (
                <div key={asset.id} className="relative group">
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 left-1 text-xs"
                  >
                    {index + 1}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveAsset(asset.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b">
                    {asset.name.length > 15 ? asset.name.slice(0, 15) + '...' : asset.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Assets */}
        {availableAssets.length > 0 && (
          <div className="space-y-3">
            <Label>Available Images</Label>
            <ScrollArea className="h-32">
              <div className="grid grid-cols-4 gap-2">
                {availableAssets.slice(0, 16).map(asset => (
                  <Button
                    key={asset.id}
                    variant="outline"
                    className="h-16 p-1"
                    onClick={() => handleAddAsset(asset)}
                    disabled={selectedAssets.length >= 6}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Combination Instructions */}
        <div className="space-y-3">
          <Label>Combination Instruction</Label>
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={getDefaultInstruction()}
          />
          
          {/* Composition Style */}
          <div className="space-y-2">
            <Label className="text-sm">Composition Style</Label>
            <Select value={compositionStyle} onValueChange={setCompositionStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOSITION_STYLES.map(style => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Advanced Parameters</Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Blend Strength: {blendStrength[0]}</Label>
                <Slider
                  value={blendStrength}
                  onValueChange={setBlendStrength}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Guidance Scale: {guidanceScale[0]}</Label>
                <Slider
                  value={guidanceScale}
                  onValueChange={setGuidanceScale}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Steps: {steps[0]}</Label>
                <Slider
                  value={steps}
                  onValueChange={setSteps}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleApplyCombination}
          disabled={isProcessing || selectedAssets.length < 2 || !instruction.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            "Processing..."
          ) : selectedAssets.length < 2 ? (
            "Select at least 2 images"
          ) : !instruction.trim() ? (
            "Add instruction"
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Combine {selectedAssets.length} Images
            </>
          )}
        </Button>

        {/* Preview */}
        {selectedAssets.length >= 2 && (
          <div className="space-y-2">
            <Label className="text-sm">Preview Arrangement</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              {selectedAssets.slice(0, 3).map((asset, index) => (
                <React.Fragment key={asset.id}>
                  <div className="flex flex-col items-center">
                    <img
                      src={asset.src}
                      alt=""
                      className="w-8 h-8 object-cover rounded border"
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      #{index + 1}
                    </span>
                  </div>
                  {index < selectedAssets.slice(0, 3).length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
              {selectedAssets.length > 3 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Badge variant="secondary">+{selectedAssets.length - 3}</Badge>
                </>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}