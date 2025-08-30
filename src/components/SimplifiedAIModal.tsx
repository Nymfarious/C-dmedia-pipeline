import React, { useState } from 'react';
import { X, SparklesIcon, ImageIcon, Edit3, Brush } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from '@/store/appStore';
import { toast } from 'sonner';

interface SimplifiedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_PRESETS = [
  { id: 'photorealistic', name: 'Photorealistic', prompt: 'photorealistic, highly detailed, professional photography' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic lighting, dramatic, film photography, professional' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, manga, japanese animation, vibrant colors' },
  { id: 'digital-art', name: 'Digital Art', prompt: 'digital art, concept art, artstation, detailed illustration' },
  { id: 'abstract', name: 'Abstract', prompt: 'abstract art, modern, geometric, artistic composition' },
  { id: 'oil-painting', name: 'Oil Painting', prompt: 'oil painting, traditional art, brushstrokes, classical painting style' },
];

const QUALITY_OPTIONS = [
  { id: 'fast', name: 'Fast', description: 'Quick generation' },
  { id: 'balanced', name: 'Balanced', description: 'Good quality & speed' },
  { id: 'quality', name: 'Quality', description: 'Best results' },
];

const DIMENSION_OPTIONS = [
  { width: 512, height: 512, label: '1:1 Square' },
  { width: 768, height: 512, label: '3:2 Landscape' },
  { width: 512, height: 768, label: '2:3 Portrait' },
  { width: 1024, height: 576, label: '16:9 Widescreen' },
];

export function SimplifiedAIModal({ isOpen, onClose }: SimplifiedAIModalProps) {
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [quality, setQuality] = useState('balanced');
  const [dimensions, setDimensions] = useState('512x512');
  const [isGenerating, setIsGenerating] = useState(false);

  console.log('SimplifiedAIModal - isOpen:', isOpen);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedStyleData = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const enhancedPrompt = selectedStyleData 
        ? `${prompt}, ${selectedStyleData.prompt}`
        : prompt;

      // Parse dimensions
      const [width, height] = dimensions.split('x').map(Number);

      const generatedAsset = await useAppStore.getState().generateDirectly(
        { 
          prompt: enhancedPrompt, 
          negativePrompt: negativePrompt.trim() || undefined,
          style: selectedStyle,
          quality,
          width,
          height
        },
        'replicate.flux-schnell' // Use working model
      );
      
      if (generatedAsset) {
        // Add to main assets store
        useAppStore.getState().addAsset(generatedAsset);
        
        // Save to AI gallery with metadata
        await useAppStore.getState().saveToAIGallery(generatedAsset, {
          prompt: enhancedPrompt,
          model: 'replicate.flux-schnell',
          parameters: { style: selectedStyle, quality, negativePrompt, dimensions },
          category: 'generated'
        });
        
        // Create canvas and auto-load asset
        const canvasId = useAppStore.getState().createCanvas('image', generatedAsset);
        useAppStore.getState().setActiveCanvas(canvasId);
        
        toast.success('Image generated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center">
            <SparklesIcon className="mr-3 h-6 w-6 text-primary" />
            AI Image Generation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Text to Image
              </TabsTrigger>
              <TabsTrigger 
                value="image-to-image" 
                disabled 
                className="flex items-center gap-2 opacity-50 cursor-not-allowed"
              >
                <Edit3 className="h-4 w-4" />
                Image to Image
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inpainting" 
                disabled 
                className="flex items-center gap-2 opacity-50 cursor-not-allowed"
              >
                <Brush className="h-4 w-4" />
                Inpainting
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text-to-image" className="space-y-6">
              {/* Prompt Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-2 min-h-[80px] resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="negative-prompt" className="text-sm font-medium">
                    Negative Prompt (Optional)
                  </Label>
                  <Input
                    id="negative-prompt"
                    placeholder="What to avoid in the image..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="w-full h-16 bg-muted rounded-md mb-2 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality and Dimensions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Generation Quality</Label>
                  <div className="space-y-2">
                    {QUALITY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setQuality(option.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          quality === option.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="font-medium">{option.name}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Dimensions</Label>
                  <Select value={dimensions} onValueChange={setDimensions}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIMENSION_OPTIONS.map((option) => (
                        <SelectItem 
                          key={`${option.width}x${option.height}`} 
                          value={`${option.width}x${option.height}`}
                        >
                          {option.label} ({option.width}×{option.height})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-8 py-2 bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="image-to-image" className="space-y-6">
              <div className="text-center py-12 text-muted-foreground">
                <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Image to Image</h3>
                <p>Transform existing images with AI. Coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="inpainting" className="space-y-6">
              <div className="text-center py-12 text-muted-foreground">
                <Brush className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">AI Inpainting</h3>
                <p>Edit specific parts of images with AI. Coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}