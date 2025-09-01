import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnhancedBrushTool } from './EnhancedBrushTool';
import { MaskPreview } from './MaskPreview';
import { InpaintingModeSelector } from './InpaintingModeSelector';
import { AdvancedInpaintingControls } from './AdvancedInpaintingControls';
import { MaskQualityFeedback } from './MaskQualityFeedback';
import { 
  Paintbrush,
  Settings,
  Undo,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';
import { processMask, MaskQualityInfo } from '@/lib/maskProcessor';
import { 
  getOptimizedInpaintingParams, 
  convertUIToParams, 
  getEnhancedNegativePrompt,
  enhanceInpaintingPrompt,
  enhanceEditPrompt,
  negativesFor
} from '@/lib/promptEnhancer';
import { INPAINT_MODELS, makeRouting, InpaintMode } from '@/constants/models';
import { normalizeMaskToWhiteEdits, canvasToDataUrl, canvasToBlob } from '@/utils/maskProcessor';
import { useToast } from '@/hooks/use-toast';

interface InpaintingToolProps {
  asset: Asset;
  onComplete: (params: ImageEditParams) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

// InpaintMode now imported from constants

export function InpaintingTool({ asset, onComplete, onCancel, className }: InpaintingToolProps) {
  const { toast } = useToast();
  
  // Core state
  const [mode, setMode] = useState<InpaintMode>('replace'); // Default to replace for masked edit
  const [instruction, setInstruction] = useState('');
  const [mask, setMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [processedMask, setProcessedMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [maskQuality, setMaskQuality] = useState<MaskQualityInfo | null>(null);
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrushTool, setShowBrushTool] = useState(false);
  const [invertMask, setInvertMask] = useState(false); // Debug option
  
  // Advanced UI controls
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qualityVsSpeed, setQualityVsSpeed] = useState([50]); // 0-100 slider
  const [precisionVsCreativity, setPrecisionVsCreativity] = useState([50]); // 0-100 slider
  const [enableCleanupPass, setEnableCleanupPass] = useState(true);
  const [maskPadding, setMaskPadding] = useState([12]);
  const [maskFeathering, setMaskFeathering] = useState([3]);

  // Mode-specific instructions
  const getDefaultInstruction = useCallback(() => {
    switch (mode) {
      case 'remove':
        return 'Remove the painted objects';
      case 'add':
        return 'Add a cat';
      case 'replace':
        return 'Change to cat';
      default:
        return '';
    }
  }, [mode]);

  // Process mask when raw mask changes
  useEffect(() => {
    if (!mask) {
      setProcessedMask(null);
      setMaskQuality(null);
      return;
    }
    
    const processRawMask = async () => {
      try {
        const result = await processMask(mask.dataUrl, {
          padding: maskPadding[0],
          featherRadius: maskFeathering[0],
          qualityCheck: true
        });
        
        setProcessedMask({ dataUrl: result.dataUrl, blob: result.blob });
        setMaskQuality(result.quality);
        
        // Show quality warnings
        if (!result.quality.isValid || result.quality.warnings.length > 0) {
          toast({
            title: "Mask Quality Check",
            description: result.quality.warnings[0] || "Consider improving the mask for better results",
            variant: result.quality.isValid ? "default" : "destructive"
          });
        }
      } catch (error) {
        console.error('Mask processing failed:', error);
        setProcessedMask(mask); // Fallback to original
      }
    };
    
    processRawMask();
  }, [mask, maskPadding, maskFeathering, toast]);

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
    // Phase 1: Input validation with specific error messages
    if (!instruction.trim()) {
      toast({
        title: "Missing Instruction",
        description: "Type what you want (e.g., \"replace with a tabby cat\").",
        variant: "destructive"
      });
      return;
    }
    
    if (!mask) {
      toast({
        title: "Missing Mask", 
        description: "Paint an area to edit first.",
        variant: "destructive"
      });
      return;
    }

    const finalMask = processedMask || mask;
    setIsProcessing(true);
    try {
      // Convert UI controls to parameters
      const { qualityLevel, precisionMultiplier } = convertUIToParams(
        qualityVsSpeed[0], 
        precisionVsCreativity[0]
      );
      
      // Get optimized parameters for mode and quality
      const optimizedParams = getOptimizedInpaintingParams(mode, qualityLevel);
      
      // Apply precision multiplier to guidance scale
      optimizedParams.guidance_scale *= precisionMultiplier;
      
      // Phase 2: Enhanced prompt processing
      const enhancedPrompt = enhanceEditPrompt({
        userText: instruction,
        mode,
        sceneHints: {
          lighting: "soft natural lighting",
          camera: "eye level perspective", 
          style: "photorealistic"
        },
        keepContext: true
      });
      
      // Get mode-specific negative prompts
      const negativePrompt = negativesFor(mode);
      
      // Phase 1.2: Normalized model routing (no more mismatches)
      const routing = makeRouting(selectedModel, mode);
      console.log('🎯 Model routing:', { selectedModel, mode, routing });
      
      // Phase 2.1: Process mask with normalization
      const maskCanvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        const ctx = maskCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        // Normalize mask semantics (white = edit, black = preserve)
        const normalizedMask = normalizeMaskToWhiteEdits(maskCanvas, {
          pad: maskPadding[0],
          feather: maskFeathering[0]
        });
        
        // Apply invert if debug option is enabled
        if (invertMask) {
          const ctx = normalizedMask.getContext('2d')!;
          const imageData = ctx.getImageData(0, 0, normalizedMask.width, normalizedMask.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Only process opaque pixels
              data[i] = 255 - data[i];     // Invert R
              data[i + 1] = 255 - data[i + 1]; // Invert G 
              data[i + 2] = 255 - data[i + 2]; // Invert B
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        const normalizedDataUrl = canvasToDataUrl(normalizedMask);
        
        continueWithProcessing(routing, enhancedPrompt, negativePrompt, optimizedParams, normalizedDataUrl);
      };
      img.src = finalMask.dataUrl;
      
      const continueWithProcessing = async (
        routing: any, 
        enhancedPrompt: string, 
        negativePrompt: string, 
        optimizedParams: any,
        maskDataUrl: string
      ) => {

        const params: ImageEditParams = {
          operation: routing.operation,
          instruction: enhancedPrompt,
          provider: routing.provider,
          maskPngDataUrl: maskDataUrl,
          maskBlob: finalMask.blob,
          mode: mode as any,
          
          // Enhanced parameters
          strength: optimizedParams.strength,
          guidance_scale: optimizedParams.guidance_scale,
          num_inference_steps: optimizedParams.num_inference_steps,
          negative_prompt: negativePrompt,
          
          // Cleanup pass
          enableCleanupPass,
          
          // Mode-specific parameters for backwards compatibility
          ...(mode === 'remove' && { removeObjectInstruction: instruction }),
          ...(mode === 'add' && { addObjectInstruction: instruction }),
        };

        console.log('🚀 Sending inpaint params:', params);
        await onComplete(params);
      };
      
      toast({
        title: "Processing Complete",
        description: `Successfully applied ${mode} operation with ${qualityLevel} quality`,
      });
      
    } catch (error) {
      console.error('Inpainting failed:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearMask = () => {
    setMask(null);
    setProcessedMask(null);
    setMaskQuality(null);
  };
  
  const handleResetAdvanced = () => {
    setQualityVsSpeed([50]);
    setPrecisionVsCreativity([50]);
    setEnableCleanupPass(true);
    setMaskPadding([12]);
    setMaskFeathering([3]);
    toast({
      title: "Settings Reset",
      description: "Advanced controls reset to default values"
    });
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
          <Label>Choose Operation</Label>
          <InpaintingModeSelector 
            mode={mode} 
            onModeChange={handleModeChange} 
          />
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
                    <div className="font-medium">{model.label}</div>
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
            {mode === 'remove' && "Simple prompts work well: 'remove dog', 'remove person', etc."}
            {mode === 'add' && "Describe what to add: 'cat', 'tree', 'blue car', etc."}
            {mode === 'replace' && "Describe the replacement: 'change to cat', 'turn into tree', etc."}
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
            
            {/* Debug option: Invert mask checkbox */}
            {mask && process.env.NODE_ENV === 'development' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="invert-mask"
                  checked={invertMask}
                  onChange={(e) => setInvertMask(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="invert-mask" className="text-xs text-muted-foreground">
                  Invert mask (debug)
                </label>
              </div>
            )}
          </div>

          {/* Mask Preview and Quality */}
          <div className="space-y-3">
            {(mask || processedMask) && (
              <MaskPreview
                maskDataUrl={processedMask?.dataUrl || mask!.dataUrl}
                imageUrl={asset.src}
                className="mt-3"
              />
            )}
            
            {maskQuality && (
              <MaskQualityFeedback quality={maskQuality} />
            )}
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <AdvancedInpaintingControls
            qualityVsSpeed={qualityVsSpeed}
            onQualityVsSpeedChange={setQualityVsSpeed}
            precisionVsCreativity={precisionVsCreativity}
            onPrecisionVsCreativityChange={setPrecisionVsCreativity}
            enableCleanupPass={enableCleanupPass}
            onEnableCleanupPassChange={setEnableCleanupPass}
            maskPadding={maskPadding}
            onMaskPaddingChange={setMaskPadding}
            maskFeathering={maskFeathering}
            onMaskFeatheringChange={setMaskFeathering}
            onResetToDefaults={handleResetAdvanced}
          />
        )}

        {/* Quality warnings */}
        {maskQuality && !maskQuality.isValid && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="font-medium mb-1">Mask needs attention:</div>
              <ul className="text-xs space-y-1">
                {maskQuality.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button - Always visible with proper sizing */}
        <div className="sticky bottom-0 bg-background pt-4 border-t">
          <Button 
            onClick={handleApplyInpaint}
            disabled={isProcessing || !mask || !instruction.trim()}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing with {convertUIToParams(qualityVsSpeed[0], precisionVsCreativity[0]).qualityLevel} quality...
              </>
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
        </div>

      </CardContent>
    </Card>
  );
}