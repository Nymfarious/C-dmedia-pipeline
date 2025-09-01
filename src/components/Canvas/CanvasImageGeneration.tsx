import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Wand2, ImageIcon, Upload, X, TypeIcon, RefreshCw } from 'lucide-react';
import { Asset, TextOverlayParams } from '@/types/media';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { fluxTextAdapter } from '@/adapters/text-gen/fluxTextAdapter';

interface CanvasImageGenerationProps {
  onComplete: (asset: Asset) => void;
  onCancel?: () => void;
  className?: string;
}

type GenerationMode = 'generate' | 'text';

interface ReferenceImage {
  id: string;
  src: string;
  name: string;
  weight: number;
}

export function CanvasImageGeneration({ onComplete, onCancel, className }: CanvasImageGenerationProps) {
  const { generateDirectly } = useAppStore();
  
  // Mode selection
  const [mode, setMode] = useState<GenerationMode>('generate');
  
  // Image Generation
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-schnell');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState([80]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  
  // Text Generation
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [textStyle, setTextStyle] = useState({
    fontSize: 'medium',
    color: 'auto',
    effect: 'none'
  });
  const [textPosition, setTextPosition] = useState('center');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  const models = [
    { key: 'flux-schnell', label: 'Flux Schnell', description: 'Fast generation, good quality' },
    { key: 'flux-dev', label: 'Flux Dev', description: 'High quality, slower' },
    { key: 'flux-pro', label: 'Flux Pro', description: 'Best quality, premium' },
    { key: 'sdxl', label: 'SDXL', description: 'Stable Diffusion XL' }
  ];

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];
    
    for (let i = 0; i < Math.min(files.length, 10 - referenceImages.length); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const src = URL.createObjectURL(file);
        newImages.push({
          id: `ref-${Date.now()}-${i}`,
          src,
          name: file.name,
          weight: 0.7
        });
      }
    }

    setReferenceImages(prev => [...prev, ...newImages]);
    toast.success(`Added ${newImages.length} reference image(s)`);
  }, [referenceImages.length]);

  const removeReferenceImage = useCallback((id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const updateImageWeight = useCallback((id: string, weight: number) => {
    setReferenceImages(prev => prev.map(img => 
      img.id === id ? { ...img, weight } : img
    ));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    try {
      const params = {
        prompt: prompt.trim(),
        model: selectedModel,
        aspect_ratio: aspectRatio,
        guidance_scale: guidanceScale[0],
        output_quality: quality[0],
        ...(referenceImages.length > 0 && {
          reference_images: referenceImages.map(img => ({
            url: img.src,
            weight: img.weight
          }))
        })
      };

      const result = await generateDirectly(params, 'replicate.enhanced');
      
      if (result && typeof result === 'object' && 'outputAssetId' in result) {
        const { assets } = useAppStore.getState();
        const outputAssetId = (result as any).outputAssetId as string;
        const generatedAsset = assets[outputAssetId];
        if (generatedAsset) {
          onComplete(generatedAsset);
          toast.success('Image generated successfully!');
        }
      } else if (result) {
        // Handle direct asset result (when result is the asset itself)
        onComplete(result as Asset);
        toast.success('Image generated successfully!');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextGeneration = async () => {
    if (!selectedAsset) {
      toast.error('Please select an image first');
      return;
    }
    
    if (!textPrompt.trim()) {
      toast.error('Please enter text to add');
      return;
    }

    setIsProcessing(true);
    try {
      const textParams: TextOverlayParams = {
        text: textPrompt.trim(),
        fontSize: textStyle.fontSize,
        color: textStyle.color,
        effect: textStyle.effect,
        position: textPosition
      };

      const result = await fluxTextAdapter.addText(selectedAsset, textParams);
      onComplete(result);
      toast.success('Text added successfully!');
    } catch (error) {
      console.error('Text generation failed:', error);
      toast.error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Generation
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={mode === 'generate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('generate')}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Generate
              </Button>
              <Button
                variant={mode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('text')}
              >
                <TypeIcon className="h-4 w-4 mr-1" />
                Add Text
              </Button>
            </div>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {mode === 'generate' && (
          <>
            {/* Prompt */}
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={3}
              />
            </div>

            {/* Reference Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Reference Images ({referenceImages.length}/10)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={referenceImages.length >= 10}
                  onClick={() => document.getElementById('reference-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Add References
                </Button>
                <input
                  id="reference-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {referenceImages.map(image => (
                    <div key={image.id} className="relative border rounded-lg p-2">
                      <img
                        src={image.src}
                        alt={image.name}
                        className="w-full h-20 object-cover rounded"
                      />
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground truncate">
                          {image.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Weight:</Label>
                          <Slider
                            value={[image.weight]}
                            onValueChange={([value]) => updateImageWeight(image.id, value)}
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">{image.weight}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeReferenceImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
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

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map(ratio => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quality: {quality[0]}%</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={60}
                  max={100}
                  step={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Guidance Scale: {guidanceScale[0]}</Label>
              <Slider
                value={guidanceScale}
                onValueChange={setGuidanceScale}
                min={1}
                max={20}
                step={0.5}
              />
            </div>
          </>
        )}

        {mode === 'text' && (
          <>
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label>Select Image</Label>
              <Button
                variant="outline"
                className="w-full h-20"
                onClick={() => {
                  // This would integrate with asset selection
                  toast.info('Asset selection integration needed');
                }}
              >
                {selectedAsset ? (
                  <img src={selectedAsset.src} alt="Selected" className="h-full object-cover rounded" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm">Choose image from canvas</div>
                  </div>
                )}
              </Button>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label>Text to Add</Label>
              <Input
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Enter text to add to the image..."
              />
            </div>

            {/* Text Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select 
                  value={textStyle.fontSize} 
                  onValueChange={(value) => setTextStyle(prev => ({ ...prev, fontSize: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <Select 
                  value={textStyle.color} 
                  onValueChange={(value) => setTextStyle(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effect</Label>
                <Select 
                  value={textStyle.effect} 
                  onValueChange={(value) => setTextStyle(prev => ({ ...prev, effect: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="shadow">Drop Shadow</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="3d">3D Effect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={textPosition} onValueChange={setTextPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Action Button */}
      <div className="p-6 border-t">
        <Button
          onClick={mode === 'generate' ? handleGenerate : handleTextGeneration}
          disabled={isProcessing || (mode === 'generate' ? !prompt.trim() : !textPrompt.trim() || !selectedAsset)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              {mode === 'generate' ? 'Generate Image' : 'Add Text'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}