import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, Trash2, Wand2, Type, ImageIcon } from 'lucide-react';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';
import { fluxTextAdapter } from '@/adapters/text-gen/fluxTextAdapter';
import { AssetImportModal } from '../AssetImportModal';
import { toast } from 'sonner';

interface CanvasImageGenerationProps {
  onComplete: (asset: Asset) => void;
  onCancel?: () => void;
  className?: string;
}

interface ReferenceImage {
  id: string;
  url: string;
  weight: number;
  name: string;
}

export function CanvasImageGeneration({ onComplete, onCancel, className }: CanvasImageGenerationProps) {
  const { generateDirectly, assets, allCategories } = useAppStore();
  
  // Generation mode: 'generate' or 'add-text'
  const [mode, setMode] = useState<'generate' | 'add-text'>('generate');
  
  // Image Generation State
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('replicate.flux');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState([80]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  
  // Text Generation State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [textColor, setTextColor] = useState('auto');
  const [textEffect, setTextEffect] = useState('none');
  const [textPosition, setTextPosition] = useState('center');
  const [isAddingText, setIsAddingText] = useState(false);

  const models = [
    { key: 'replicate.flux', label: 'Flux Schnell', description: 'Fast, high-quality generation' },
    { key: 'replicate.sd', label: 'Stable Diffusion XL', description: 'Detailed, artistic results' },
  ];

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Photo (4:3)' },
    { value: '3:4', label: 'Portrait Photo (3:4)' },
  ];

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const newRef: ReferenceImage = {
          id: crypto.randomUUID(),
          url,
          weight: 0.7,
          name: file.name
        };
        
        setReferenceImages(prev => {
          if (prev.length >= 10) {
            toast.error('Maximum 10 reference images allowed');
            return prev;
          }
          return [...prev, newRef];
        });
      }
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const updateReferenceWeight = (id: string, weight: number) => {
    setReferenceImages(prev => 
      prev.map(img => img.id === id ? { ...img, weight } : img)
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const params = {
        prompt: prompt.trim(),
        aspect: aspectRatio,
        outputQuality: quality[0],
        guidanceScale: guidanceScale[0],
        reference_images: referenceImages.map(ref => ({
          url: ref.url,
          weight: ref.weight
        }))
      };

      console.log('CanvasImageGeneration - Generating with params:', params);
      const asset = await generateDirectly(params, selectedModel);
      
      // Apply category if selected
      if (selectedCategory) {
        asset.category = selectedCategory;
        asset.subcategory = selectedSubcategory || undefined;
      }
      
      console.log('CanvasImageGeneration - Generated asset:', asset);
      
      onComplete(asset);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextGeneration = async () => {
    if (!selectedAsset) {
      toast.error('Please select an asset to add text to');
      return;
    }
    
    if (!textPrompt.trim()) {
      toast.error('Please enter text to add');
      return;
    }

    setIsAddingText(true);
    try {
      const params = {
        text: textPrompt.trim(),
        fontSize,
        color: textColor,
        effect: textEffect,
        position: textPosition
      };

      console.log('CanvasImageGeneration - Adding text with params:', params);
      const asset = await fluxTextAdapter.addText(selectedAsset, params);
      console.log('CanvasImageGeneration - Text added to asset:', asset);
      
      onComplete(asset);
      toast.success('Text added successfully!');
    } catch (error) {
      console.error('Text generation failed:', error);
      toast.error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingText(false);
    }
  };

  const availableAssets = Object.values(assets).filter(asset => asset.type === 'image');

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Generation
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={mode === 'generate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('generate')}
                className="h-8 px-3"
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Generate
              </Button>
              <Button
                variant={mode === 'add-text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('add-text')}
                className="h-8 px-3"
              >
                <Type className="h-4 w-4 mr-1" />
                Add Text
              </Button>
            </div>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {mode === 'generate' ? (
          <>
            {/* Image Generation Mode */}
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category (for organization)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Reference Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Reference Images (Max 10)</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{referenceImages.length}/10</Badge>
                  <AssetImportModal 
                    onImport={(asset) => {
                      if (referenceImages.length < 10) {
                        const newRef: ReferenceImage = {
                          id: crypto.randomUUID(),
                          url: asset.src,
                          weight: 0.5,
                          name: asset.name
                        };
                        setReferenceImages(prev => [...prev, newRef]);
                      }
                    }}
                    triggerText="Import"
                  />
                </div>
              </div>
              
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                  input.click();
                }}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop reference images here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 10 images, each with adjustable influence weight
                </p>
              </div>

              {referenceImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {referenceImages.map((ref) => (
                    <div key={ref.id} className="relative group border rounded-lg p-2 bg-muted/50">
                      <img 
                        src={ref.url} 
                        alt={ref.name}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                      <div className="space-y-2">
                        <div className="text-xs font-medium truncate" title={ref.name}>
                          {ref.name}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Weight</span>
                            <span>{Math.round(ref.weight * 100)}%</span>
                          </div>
                          <Slider
                            value={[ref.weight]}
                            onValueChange={([value]) => updateReferenceWeight(ref.id, value)}
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            className="h-2"
                          />
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeReferenceImage(ref.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quality ({quality[0]}%)</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={50}
                  max={100}
                  step={10}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Guidance Scale ({guidanceScale[0]})</Label>
                <Slider
                  value={guidanceScale}
                  onValueChange={setGuidanceScale}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Text Generation Mode */}
            <div className="space-y-2">
              <Label>Select Asset</Label>
              <Select 
                value={selectedAsset?.id || ''} 
                onValueChange={(id) => setSelectedAsset(availableAssets.find(a => a.id === id) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an image to add text to" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex items-center gap-2">
                        <img src={asset.src} alt={asset.name} className="w-8 h-8 object-cover rounded" />
                        <span className="truncate">{asset.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Text to Add</Label>
              <Input
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Enter text to add to the image..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
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
                <Label>Text Color</Label>
                <Select value={textColor} onValueChange={setTextColor}>
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
                <Label>Text Effect</Label>
                <Select value={textEffect} onValueChange={setTextEffect}>
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
                    <SelectItem value="center-left">Center Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="center-right">Center Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedAsset && (
              <div className="border rounded-lg p-3 bg-muted/50">
                <Label className="text-sm font-medium">Preview</Label>
                <div className="mt-2 flex items-center gap-3">
                  <img 
                    src={selectedAsset.src} 
                    alt={selectedAsset.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <div className="text-sm font-medium">{selectedAsset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {textPrompt ? `Will add: "${textPrompt}"` : 'Enter text to see preview'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Action Button */}
      <div className="p-6 pt-0 border-t bg-card/50 backdrop-blur-sm">
        <Button 
          onClick={mode === 'generate' ? handleGenerate : handleTextGeneration}
          disabled={mode === 'generate' ? (isGenerating || !prompt.trim()) : (isAddingText || !selectedAsset || !textPrompt.trim())}
          className="w-full"
          size="lg"
        >
          {mode === 'generate' ? (
            isGenerating ? 'Generating...' : 'Generate Image'
          ) : (
            isAddingText ? 'Adding Text...' : 'Add Text'
          )}
        </Button>
      </div>
    </Card>
  );
}