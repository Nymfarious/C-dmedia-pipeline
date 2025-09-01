import React, { useState } from 'react';
import { X, SparklesIcon, ImageIcon, Edit3, Brush, Settings, ChevronDown, Zap, Clock, Star, Coins, TrendingUp, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import useAppStore from '@/store/appStore';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';

interface EnhancedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Model Categories with detailed info
const MODEL_CATEGORIES = [
  {
    name: "Flux Models",
    description: "Premium speed & quality",
    models: [
      { key: "replicate.flux-schnell", name: "Flux Schnell", speed: "fast", quality: "high", cost: "low", specialty: "General purpose, fast" },
      { key: "replicate.flux-dev", name: "Flux Dev", speed: "medium", quality: "very-high", cost: "medium", specialty: "Development & iteration" },
      { key: "replicate.flux-pro", name: "Flux Pro", speed: "medium", quality: "premium", cost: "high", specialty: "Professional quality" },
      { key: "replicate.flux-ultra", name: "Flux Ultra", speed: "slow", quality: "premium", cost: "very-high", specialty: "Ultimate quality" },
    ]
  },
  {
    name: "OpenAI",
    description: "Latest DALL-E models",
    models: [
      { key: "openai.dall-e", name: "DALL-E 3", speed: "medium", quality: "high", cost: "medium", specialty: "Natural language understanding" },
    ]
  },
  {
    name: "Stable Diffusion",
    description: "Classic open-source models",
    models: [
      { key: "replicate.sdxl", name: "SDXL", speed: "medium", quality: "high", cost: "low", specialty: "Versatile, reliable" },
      { key: "replicate.sdxl-lightning", name: "SDXL Lightning", speed: "very-fast", quality: "high", cost: "low", specialty: "Ultra-fast generation" },
      { key: "replicate.sd-turbo", name: "SD Turbo", speed: "very-fast", quality: "medium", cost: "very-low", specialty: "Real-time generation" },
    ]
  },
  {
    name: "Photorealistic",
    description: "Hyperreal photography",
    models: [
      { key: "replicate.real-vis", name: "RealVis XL", speed: "medium", quality: "very-high", cost: "medium", specialty: "Photorealistic images" },
      { key: "replicate.realistic-vision", name: "Realistic Vision", speed: "medium", quality: "high", cost: "medium", specialty: "Portrait photography" },
      { key: "replicate.dreamshaper", name: "DreamShaper", speed: "medium", quality: "high", cost: "medium", specialty: "Cinematic realism" },
    ]
  },
  {
    name: "Anime & Art",
    description: "Stylized illustrations",
    models: [
      { key: "replicate.anime-diffusion", name: "Anime Diffusion", speed: "medium", quality: "high", cost: "low", specialty: "Anime characters" },
      { key: "replicate.anything-v5", name: "Anything V5", speed: "medium", quality: "high", cost: "low", specialty: "Versatile anime" },
      { key: "replicate.niji-diffusion", name: "Niji Diffusion", speed: "medium", quality: "high", cost: "medium", specialty: "Professional anime" },
    ]
  },
  {
    name: "Artistic Styles",
    description: "Creative & artistic",
    models: [
      { key: "replicate.midjourney-v4", name: "Midjourney V4", speed: "medium", quality: "very-high", cost: "high", specialty: "Artistic compositions" },
      { key: "replicate.van-gogh", name: "Van Gogh Style", speed: "medium", quality: "high", cost: "medium", specialty: "Classical art style" },
      { key: "replicate.synthwave", name: "Synthwave", speed: "medium", quality: "high", cost: "medium", specialty: "Retro cyberpunk" },
    ]
  }
];

// Enhanced style presets with thumbnails and optimal models
const STYLE_PRESETS = [
  { 
    id: 'photorealistic', 
    name: 'Photorealistic', 
    prompt: 'photorealistic, highly detailed, professional photography, sharp focus, 8k resolution',
    thumbnail: '📸',
    optimalModels: ['replicate.real-vis', 'replicate.realistic-vision', 'replicate.dreamshaper']
  },
  { 
    id: 'cinematic', 
    name: 'Cinematic', 
    prompt: 'cinematic lighting, dramatic, film photography, movie scene, professional cinematography',
    thumbnail: '🎬',
    optimalModels: ['replicate.dreamshaper', 'replicate.midjourney-v4', 'replicate.flux-dev']
  },
  { 
    id: 'anime', 
    name: 'Anime', 
    prompt: 'anime style, manga, japanese animation, vibrant colors, detailed character art',
    thumbnail: '🎨',
    optimalModels: ['replicate.anime-diffusion', 'replicate.anything-v5', 'replicate.niji-diffusion']
  },
  { 
    id: 'digital-art', 
    name: 'Digital Art', 
    prompt: 'digital art, concept art, artstation, detailed illustration, digital painting',
    thumbnail: '🖼️',
    optimalModels: ['replicate.midjourney-v4', 'replicate.flux-dev', 'replicate.sdxl']
  },
  { 
    id: 'abstract', 
    name: 'Abstract', 
    prompt: 'abstract art, modern, geometric, artistic composition, contemporary style',
    thumbnail: '🎭',
    optimalModels: ['replicate.midjourney-v4', 'replicate.synthwave', 'replicate.flux-pro']
  },
  { 
    id: 'oil-painting', 
    name: 'Oil Painting', 
    prompt: 'oil painting, traditional art, brushstrokes, classical painting style, fine art',
    thumbnail: '🖌️',
    optimalModels: ['replicate.van-gogh', 'replicate.midjourney-v4', 'replicate.flux-dev']
  },
];

// Quality settings with detailed descriptions
const QUALITY_OPTIONS = [
  { 
    id: 'fast', 
    name: 'Fast', 
    description: 'Quick generation (4-8 steps)',
    icon: <Zap className="h-4 w-4" />,
    steps: 4,
    guidance: 1.0
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    description: 'Good quality & speed (12-20 steps)',
    icon: <Clock className="h-4 w-4" />,
    steps: 16,
    guidance: 3.5
  },
  { 
    id: 'quality', 
    name: 'Quality', 
    description: 'Best results (25-50 steps)',
    icon: <Star className="h-4 w-4" />,
    steps: 35,
    guidance: 7.5
  },
];

// Expanded dimension options
const DIMENSION_OPTIONS = [
  { width: 512, height: 512, label: '1:1 Square', aspect: '1:1' },
  { width: 768, height: 512, label: '3:2 Landscape', aspect: '3:2' },
  { width: 512, height: 768, label: '2:3 Portrait', aspect: '2:3' },
  { width: 1024, height: 576, label: '16:9 Widescreen', aspect: '16:9' },
  { width: 576, height: 1024, label: '9:16 Vertical', aspect: '9:16' },
  { width: 1024, height: 768, label: '4:3 Standard', aspect: '4:3' },
  { width: 1024, height: 1024, label: '1:1 Large Square', aspect: '1:1' },
];

export function EnhancedAIModal({ isOpen, onClose }: EnhancedAIModalProps) {
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedModel, setSelectedModel] = useState('replicate.flux-schnell');
  const [quality, setQuality] = useState('balanced');
  const [dimensions, setDimensions] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [customSeed, setCustomSeed] = useState('');
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  const [inferenceSteps, setInferenceSteps] = useState([20]);

  // Image reference state (up to 10 images)
  const [referenceImages, setReferenceImages] = useState<Array<{id: string, url: string, file: File | null, weight: number}>>([]);
  const [showReferenceSection, setShowReferenceSection] = useState(false);

  // Text generation state
  const [textPrompt, setTextPrompt] = useState('');
  const [textPosition, setTextPosition] = useState<{x: number, y: number} | null>(null);
  const [textStyle, setTextStyle] = useState({
    fontSize: 'medium',
    color: 'auto',
    effect: 'none'
  });

  if (!isOpen) return null;

  const getModelInfo = (modelKey: string) => {
    for (const category of MODEL_CATEGORIES) {
      const model = category.models.find(m => m.key === modelKey);
      if (model) return model;
    }
    return null;
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'very-fast': return <Zap className="h-3 w-3 text-green-500" />;
      case 'fast': return <TrendingUp className="h-3 w-3 text-blue-500" />;
      case 'medium': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'slow': return <Clock className="h-3 w-3 text-orange-500" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getCostIcon = (cost: string) => {
    switch (cost) {
      case 'very-low': return <Badge variant="secondary" className="text-xs">$</Badge>;
      case 'low': return <Badge variant="secondary" className="text-xs">$$</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">$$$</Badge>;
      case 'high': return <Badge variant="secondary" className="text-xs">$$$$</Badge>;
      case 'very-high': return <Badge variant="secondary" className="text-xs">$$$$$</Badge>;
      default: return <Badge variant="secondary" className="text-xs">$$</Badge>;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedStyleData = STYLE_PRESETS.find(s => s.id === selectedStyle);
      let enhancedPrompt = selectedStyleData 
        ? `${prompt}, ${selectedStyleData.prompt}`
        : prompt;

      // Add reference image influence to prompt if references exist
      if (referenceImages.length > 0) {
        const refDescriptions = referenceImages
          .filter(ref => ref.url)
          .map(ref => `reference style (${ref.weight}% influence)`)
          .join(', ');
        enhancedPrompt += `, incorporating ${refDescriptions}`;
      }

      // Parse dimensions
      const [width, height] = dimensions.split('x').map(Number);

      // Get quality settings
      const qualitySettings = QUALITY_OPTIONS.find(q => q.id === quality);

      console.log('Starting generation with:', { 
        prompt: enhancedPrompt, 
        model: selectedModel,
        width, 
        height,
        references: referenceImages.length
      });
      
      const generatedAsset = await useAppStore.getState().generateDirectly(
        { 
          prompt: enhancedPrompt, 
          negativePrompt: negativePrompt.trim() || undefined,
          style: selectedStyle,
          quality,
          width,
          height,
          seed: customSeed ? parseInt(customSeed) : undefined,
          guidance_scale: guidanceScale[0],
          num_inference_steps: inferenceSteps[0],
          // Pass reference images
          refs: referenceImages.filter(ref => ref.url).map(ref => ref.url)
        },
        selectedModel
      );
      
      console.log('Generation completed:', generatedAsset);
      
      if (generatedAsset) {
        // Add to main assets store
        useAppStore.getState().addAsset(generatedAsset);
        
        // Save to AI gallery with metadata
        await useAppStore.getState().saveToAIGallery(generatedAsset, {
          prompt: enhancedPrompt,
          model: selectedModel,
          parameters: { 
            style: selectedStyle, 
            quality, 
            negativePrompt, 
            dimensions,
            seed: customSeed,
            guidance_scale: guidanceScale[0],
            inference_steps: inferenceSteps[0],
            referenceImages: referenceImages.length
          },
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
      
      // More detailed error handling
      if (error instanceof SyntaxError) {
        toast.error('Invalid server response - please try again');
      } else if (error instanceof Error) {
        toast.error(`Generation failed: ${error.message}`);
      } else {
        toast.error('Failed to generate image - unknown error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextGenerate = async () => {
    if (!textPrompt.trim()) {
      toast.error('Please enter text content');
      return;
    }

    const assets = Object.values(useAppStore.getState().assets);
    const selectedAsset = assets.find(a => a.type === 'image'); // Get first available image
    
    if (!selectedAsset) {
      toast.error('Please generate or upload an image first');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting text generation with:', { 
        text: textPrompt,
        style: textStyle,
        asset: selectedAsset.name
      });

      // Use the flux text adapter directly
      const { fluxTextAdapter } = await import('@/adapters/text-gen/fluxTextAdapter');
      const textWithImageAsset = await fluxTextAdapter.addText(selectedAsset, {
        text: textPrompt,
        fontSize: textStyle.fontSize,
        color: textStyle.color,
        effect: textStyle.effect,
        position: textPosition || undefined
      });
      
      console.log('Text generation completed:', textWithImageAsset);
      
      if (textWithImageAsset) {
        // Add to main assets store
        useAppStore.getState().addAsset(textWithImageAsset);
        
        // Save to AI gallery with metadata
        await useAppStore.getState().saveToAIGallery(textWithImageAsset, {
          prompt: `Add text: "${textPrompt}"`,
          model: 'flux-dev',
          parameters: { 
            text: textPrompt,
            style: textStyle,
            baseImage: selectedAsset.name
          },
          category: 'generated'
        });
        
        // Create canvas and auto-load asset
        const canvasId = useAppStore.getState().createCanvas('image', textWithImageAsset);
        useAppStore.getState().setActiveCanvas(canvasId);
        
        toast.success('AI text generated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Text generation failed:', error);
      toast.error(`Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const modelInfo = getModelInfo(selectedModel);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-5xl mx-4 max-h-[95vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Text to Image
              </TabsTrigger>
              <TabsTrigger 
                value="image-to-image" 
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Image to Image
              </TabsTrigger>
              <TabsTrigger 
                value="text-generation" 
                className="flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                AI Text
              </TabsTrigger>
              <TabsTrigger 
                value="inpainting" 
                className="flex items-center gap-2"
              >
                <Brush className="h-4 w-4" />
                Inpainting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text-to-image" className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center justify-between w-full">
                        <span>{modelInfo?.name || 'Select Model'}</span>
                        {modelInfo && (
                          <div className="flex items-center gap-2">
                            {getSpeedIcon(modelInfo.speed)}
                            {getCostIcon(modelInfo.cost)}
                          </div>
                        )}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {MODEL_CATEGORIES.map((category) => (
                      <div key={category.name}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          {category.name} - {category.description}
                        </div>
                        {category.models.map((model) => (
                          <SelectItem key={model.key} value={model.key}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">{model.specialty}</div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {getSpeedIcon(model.speed)}
                                {getCostIcon(model.cost)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {modelInfo && (
                  <div className="text-xs text-muted-foreground">
                    {modelInfo.specialty} • Speed: {modelInfo.speed} • Quality: {modelInfo.quality}
                  </div>
                )}
              </div>

              {/* Reference Images Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Reference Images (Optional)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReferenceSection(!showReferenceSection)}
                  >
                    {showReferenceSection ? 'Hide' : 'Add'} References
                  </Button>
                </div>
                
                {showReferenceSection && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                      {referenceImages.map((ref, index) => (
                        <div key={ref.id} className="relative">
                          <div className="aspect-square border-2 border-dashed border-border rounded-lg overflow-hidden bg-background">
                            {ref.url ? (
                              <img src={ref.url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                Drop image or click
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setReferenceImages(prev => prev.map(r => 
                                  r.id === ref.id ? {...r, url, file} : r
                                ));
                              }
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setReferenceImages(prev => prev.filter(r => r.id !== ref.id))}
                          >
                            ×
                          </Button>
                          <div className="mt-2">
                            <Label className="text-xs">Weight: {ref.weight}%</Label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              step="10"
                              value={ref.weight}
                              onChange={(e) => setReferenceImages(prev => prev.map(r => 
                                r.id === ref.id ? {...r, weight: parseInt(e.target.value)} : r
                              ))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {referenceImages.length < 10 && (
                      <Button
                        variant="outline"
                        onClick={() => setReferenceImages(prev => [...prev, {
                          id: crypto.randomUUID(),
                          url: '',
                          file: null,
                          weight: 50
                        }])}
                        className="w-full"
                      >
                        Add Reference Image ({referenceImages.length}/10)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Style Presets */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Style Preset</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="text-3xl mb-2 text-center">{style.thumbnail}</div>
                      <div className="text-sm font-medium">{style.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        Optimized for {style.optimalModels[0]?.replace('replicate.', '')}
                      </div>
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
                        <div className="flex items-center gap-2 font-medium">
                          {option.icon}
                          {option.name}
                        </div>
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

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced Options
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="seed" className="text-sm font-medium">
                        Seed (Optional)
                      </Label>
                      <Input
                        id="seed"
                        type="number"
                        placeholder="Random"
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">
                        Guidance Scale: {guidanceScale[0]}
                      </Label>
                      <Slider
                        value={guidanceScale}
                        onValueChange={setGuidanceScale}
                        min={1}
                        max={20}
                        step={0.5}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">
                        Inference Steps: {inferenceSteps[0]}
                      </Label>
                      <Slider
                        value={inferenceSteps}
                        onValueChange={setInferenceSteps}
                        min={4}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Generate Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-8 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Image
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

            <TabsContent value="image-to-image" className="space-y-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Image to image generation with reference images</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a base image and modify it with AI using reference images for style guidance
                </p>
              </div>
            </TabsContent>

            <TabsContent value="text-generation" className="space-y-6">
              {/* AI Text Generation Tab */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">AI Text Generation</Label>
                  <p className="text-sm text-muted-foreground">Generate text overlays that perfectly match your image style</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="text-prompt">Text Content</Label>
                    <Input
                      id="text-prompt"
                      placeholder="What text should appear? (e.g., 'Welcome to Paradise')"
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Font Size</Label>
                      <Select value={textStyle.fontSize} onValueChange={(value) => 
                        setTextStyle(prev => ({...prev, fontSize: value}))
                      }>
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
                    
                    <div>
                      <Label className="text-sm">Color Style</Label>
                      <Select value={textStyle.color} onValueChange={(value) => 
                        setTextStyle(prev => ({...prev, color: value}))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (AI decides)</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Effects</Label>
                      <Select value={textStyle.effect} onValueChange={(value) => 
                        setTextStyle(prev => ({...prev, effect: value}))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="shadow">Drop Shadow</SelectItem>
                          <SelectItem value="glow">Glow</SelectItem>
                          <SelectItem value="3d">3D Effect</SelectItem>
                          <SelectItem value="neon">Neon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      💡 AI will automatically analyze your image and generate text that perfectly matches the style, lighting, and aesthetic.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The text will be rendered with proper perspective, shadows, and integration into the scene.
                    </p>
                  </div>
                </div>
                
                {/* Generate Text Button */}
                <Button
                  onClick={handleTextGenerate}
                  disabled={isGenerating || !textPrompt.trim()}
                  className="w-full h-12"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating AI Text...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate AI Text
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="inpainting" className="space-y-6">
              <div className="text-center py-12 text-muted-foreground">
                <Brush className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">AI Inpainting</h3>
                <p>Use the inpainting tool in the main canvas to edit specific parts of images with AI.</p>
                <p className="text-sm mt-2">1. Load or generate an image → 2. Click the inpainting tool in the toolbar → 3. Paint areas to modify</p>
                <Button 
                  onClick={onClose} 
                  className="mt-4"
                  variant="outline"
                >
                  Go to Canvas
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}