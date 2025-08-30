import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedBrushTool } from './EnhancedBrushTool';
import { 
  Minus, 
  Plus, 
  Replace, 
  Paintbrush,
  Settings,
  Undo,
  Save
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';

interface InpaintingToolProps {
  asset: Asset;
  onComplete: (params: ImageEditParams) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

type InpaintMode = 'remove' | 'add' | 'replace';

const INPAINT_MODELS = [
  { key: 'flux-inpaint', name: 'FLUX Inpaint', description: 'High-quality precision inpainting' },
  { key: 'nano-banana-edit', name: 'Nano Banana', description: 'AI-powered natural language editing' },
  { key: 'advanced-object-removal', name: 'Advanced Remover', description: 'Clean object removal' },
];

export function InpaintingTool({ asset, onComplete, onCancel, className }: InpaintingToolProps) {
  const [mode, setMode] = useState<InpaintMode>('remove');
  const [instruction, setInstruction] = useState('');
  const [mask, setMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [selectedModel, setSelectedModel] = useState('flux-inpaint');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrushTool, setShowBrushTool] = useState(false);
  
  // Advanced parameters
  const [strength, setStrength] = useState([0.8]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  const [steps, setSteps] = useState([20]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Mode-specific instructions
  const getDefaultInstruction = useCallback(() => {
    switch (mode) {
      case 'remove':
        return 'Remove the painted objects from the image';
      case 'add':
        return 'Add a beautiful object in the painted area';
      case 'replace':
        return 'Replace the painted objects with something new';
      default:
        return '';
    }
  }, [mode]);

  const handleMaskExport = (maskData: { dataUrl: string; blob: Blob }) => {
    setMask(maskData);
    setShowBrushTool(false);
  };

  const handleModeChange = (newMode: InpaintMode) => {
    setMode(newMode);
    if (!instruction) {
      setInstruction(getDefaultInstruction());
    }
  };

  const handleStartPainting = () => {
    setShowBrushTool(true);
  };

  const handleApplyInpaint = async () => {
    if (!mask || !instruction) return;

    setIsProcessing(true);
    try {
      const operation = mode === 'remove' ? 'advanced-object-removal' : 
                      mode === 'add' ? 'add-object' : 
                      'flux-inpaint';

      const params: ImageEditParams = {
        operation,
        instruction,
        provider: `replicate.${selectedModel}`,
        maskPngDataUrl: mask.dataUrl,
        maskBlob: mask.blob,
        // Advanced parameters
        strength: strength[0],
        guidance_scale: guidanceScale[0],
        num_inference_steps: steps[0],
        // Mode-specific parameters
        ...(mode === 'remove' && { removeObjectInstruction: instruction }),
        ...(mode === 'add' && { addObjectInstruction: instruction }),
      };

      await onComplete(params);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearMask = () => {
    setMask(null);
  };

  if (showBrushTool) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Paint Area to {mode === 'remove' ? 'Remove' : mode === 'add' ? 'Add To' : 'Replace'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedBrushTool
            imageUrl={asset.src}
            onExportMask={handleMaskExport}
            onCancel={() => setShowBrushTool(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            AI Inpainting Tool
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
          <Label>Inpainting Mode</Label>
          <Tabs value={mode} onValueChange={(value) => handleModeChange(value as InpaintMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="remove" className="flex items-center gap-1">
                <Minus className="h-4 w-4" />
                Remove
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add
              </TabsTrigger>
              <TabsTrigger value="replace" className="flex items-center gap-1">
                <Replace className="h-4 w-4" />
                Replace
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INPAINT_MODELS.map(model => (
                <SelectItem key={model.key} value={model.key}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instruction */}
        <div className="space-y-2">
          <Label>
            {mode === 'remove' ? 'Removal Instruction' : 
             mode === 'add' ? 'Addition Instruction' : 
             'Replacement Instruction'}
          </Label>
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={getDefaultInstruction()}
          />
          <div className="text-xs text-muted-foreground">
            {mode === 'remove' && "Describe what to remove or leave empty for automatic detection"}
            {mode === 'add' && "Describe what to add in the painted area"}
            {mode === 'replace' && "Describe what to replace the painted objects with"}
          </div>
        </div>

        {/* Mask Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Mask Area</Label>
            {mask && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMask}
              >
                <Undo className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={mask ? "default" : "destructive"}>
              {mask ? "Mask Created" : "No Mask"}
            </Badge>
            <Button
              variant={mask ? "outline" : "default"}
              size="sm"
              onClick={handleStartPainting}
            >
              <Paintbrush className="h-4 w-4 mr-1" />
              {mask ? "Edit Mask" : "Create Mask"}
            </Button>
          </div>
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Advanced Parameters</Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Strength: {strength[0]}</Label>
                <Slider
                  value={strength}
                  onValueChange={setStrength}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How much to change the original image (higher = more change)
                </div>
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
                <div className="text-xs text-muted-foreground">
                  How closely to follow the instruction (higher = more precise)
                </div>
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
                <div className="text-xs text-muted-foreground">
                  Quality vs speed trade-off (higher = better quality)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleApplyInpaint}
          disabled={isProcessing || !mask || !instruction.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            "Processing..."
          ) : !mask ? (
            "Create Mask First"
          ) : !instruction.trim() ? (
            "Add Instruction"
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Apply {mode === 'remove' ? 'Removal' : mode === 'add' ? 'Addition' : 'Replacement'}
            </>
          )}
        </Button>

      </CardContent>
    </Card>
  );
}