import React, { useState } from 'react';
import { X, SparklesIcon, ImageIcon, Settings, Wand2, Clock, Zap, Palette, DollarSign } from 'lucide-react';
import { providers } from '@/adapters/registry';
import useAppStore from '@/store/appStore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelInfo {
  key: string;
  name: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'ultra';
  specialty: string;
  cost: 'low' | 'medium' | 'high';
}

interface ModelCategory {
  name: string;
  models: string[];
}

const MODEL_CATEGORIES: ModelCategory[] = [
  {
    name: "⚡ Speed & Quality Leaders",
    models: ['replicate.flux-schnell', 'replicate.flux-dev', 'replicate.flux-pro', 'replicate.flux-ultra']
  },
  {
    name: "📸 Photorealistic",
    models: ['replicate.real-vis', 'replicate.dreamshaper', 'replicate.deliberate', 'replicate.realistic-vision']
  },
  {
    name: "🎨 Anime & Art",
    models: ['replicate.anime-diffusion', 'replicate.anything-v5', 'replicate.niji-diffusion', 'replicate.openjourney']
  },
  {
    name: "🖼️ Artistic Styles",
    models: ['replicate.midjourney-v4', 'replicate.protogen', 'replicate.synthwave', 'replicate.van-gogh']
  },
  {
    name: "🔧 Stable Diffusion",
    models: ['replicate.sdxl', 'replicate.sd-turbo', 'replicate.sdxl-lightning', 'replicate.sd-1-5']
  },
  {
    name: "🎯 Specialized",
    models: ['replicate.logo-diffusion', 'replicate.interior-design', 'replicate.fashion-diffusion']
  },
  {
    name: "🎭 Creative & Alternative",
    models: ['replicate.dall-e-clone', 'replicate.playground-v2']
  }
];

const MODEL_INFO: Record<string, ModelInfo> = {
  // Flux Models - Speed & Quality Leaders
  'replicate.flux-schnell': {
    key: 'replicate.flux-schnell',
    name: 'Flux Schnell',
    description: 'Lightning-fast image generation with excellent quality',
    speed: 'fast',
    quality: 'high',
    specialty: 'Speed & Versatility',
    cost: 'low'
  },
  'replicate.flux-dev': {
    key: 'replicate.flux-dev', 
    name: 'Flux Dev',
    description: 'Developer model with enhanced control and precision',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Developer Control',
    cost: 'medium'
  },
  'replicate.flux-pro': {
    key: 'replicate.flux-pro',
    name: 'Flux Pro',
    description: 'Professional-grade images with exceptional detail',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Professional Photography',
    cost: 'high'
  },
  'replicate.flux-ultra': {
    key: 'replicate.flux-ultra',
    name: 'Flux Ultra',
    description: 'Ultimate quality for artistic and creative work',
    speed: 'slow',
    quality: 'ultra',
    specialty: 'Ultimate Quality',
    cost: 'high'
  },

  // Photorealistic Models
  'replicate.real-vis': {
    key: 'replicate.real-vis',
    name: 'RealVisXL',
    description: 'Ultra-realistic photographs and portraits',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Realistic Photography',
    cost: 'medium'
  },
  'replicate.dreamshaper': {
    key: 'replicate.dreamshaper',
    name: 'DreamShaper',
    description: 'Versatile model excelling at both realism and creativity',
    speed: 'medium',
    quality: 'high',
    specialty: 'Versatile Realism',
    cost: 'low'
  },
  'replicate.deliberate': {
    key: 'replicate.deliberate',
    name: 'Deliberate',
    description: 'High-quality realistic images with artistic flair',
    speed: 'medium',
    quality: 'high',
    specialty: 'Artistic Realism',
    cost: 'low'
  },
  'replicate.realistic-vision': {
    key: 'replicate.realistic-vision',
    name: 'Realistic Vision',
    description: 'Photorealistic images with natural lighting',
    speed: 'fast',
    quality: 'high',
    specialty: 'Natural Photography',
    cost: 'low'
  },

  // Anime & Art Models
  'replicate.anime-diffusion': {
    key: 'replicate.anime-diffusion',
    name: 'Anime Diffusion',
    description: 'High-quality anime and manga-style artwork',
    speed: 'fast',
    quality: 'high',
    specialty: 'Anime & Manga',
    cost: 'low'
  },
  'replicate.anything-v5': {
    key: 'replicate.anything-v5',
    name: 'Anything V5',
    description: 'Versatile anime model with exceptional detail',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Premium Anime',
    cost: 'medium'
  },
  'replicate.niji-diffusion': {
    key: 'replicate.niji-diffusion',
    name: 'Niji Diffusion',
    description: 'Japanese illustration and anime art specialist',
    speed: 'medium',
    quality: 'high',
    specialty: 'Japanese Art',
    cost: 'medium'
  },
  'replicate.openjourney': {
    key: 'replicate.openjourney',
    name: 'OpenJourney',
    description: 'Midjourney-inspired artistic generation',
    speed: 'fast',
    quality: 'high',
    specialty: 'Artistic Illustrations',
    cost: 'low'
  },

  // Artistic & Style Models
  'replicate.midjourney-v4': {
    key: 'replicate.midjourney-v4',
    name: 'Midjourney V4',
    description: 'Midjourney-style artistic and creative imagery',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Midjourney Style',
    cost: 'medium'
  },
  'replicate.protogen': {
    key: 'replicate.protogen',
    name: 'Protogen',
    description: 'Futuristic and sci-fi themed generations',
    speed: 'fast',
    quality: 'high',
    specialty: 'Sci-Fi & Futuristic',
    cost: 'low'
  },
  'replicate.synthwave': {
    key: 'replicate.synthwave',
    name: 'Synthwave',
    description: 'Retro-futuristic 80s aesthetic images',
    speed: 'fast',
    quality: 'high',
    specialty: 'Retro & Synthwave',
    cost: 'low'
  },
  'replicate.van-gogh': {
    key: 'replicate.van-gogh',
    name: 'Van Gogh Style',
    description: 'Classical painting styles and artistic techniques',
    speed: 'medium',
    quality: 'high',
    specialty: 'Classical Art',
    cost: 'low'
  },

  // Stable Diffusion Family
  'replicate.sdxl': {
    key: 'replicate.sdxl',
    name: 'SDXL Base',
    description: 'Stable Diffusion XL - reliable and customizable',
    speed: 'medium',
    quality: 'high',
    specialty: 'Customization & Control',
    cost: 'low'
  },
  'replicate.sd-turbo': {
    key: 'replicate.sd-turbo',
    name: 'SD Turbo',
    description: 'Ultra-fast Stable Diffusion for rapid iterations',
    speed: 'fast',
    quality: 'standard',
    specialty: 'Speed Optimized',
    cost: 'low'
  },
  'replicate.sdxl-lightning': {
    key: 'replicate.sdxl-lightning',
    name: 'SDXL Lightning',
    description: 'Accelerated SDXL with 4-step generation',
    speed: 'fast',
    quality: 'high',
    specialty: 'Fast SDXL',
    cost: 'low'
  },
  'replicate.sd-1-5': {
    key: 'replicate.sd-1-5',
    name: 'SD 1.5',
    description: 'Classic Stable Diffusion with broad compatibility',
    speed: 'medium',
    quality: 'standard',
    specialty: 'Classic & Compatible',
    cost: 'low'
  },

  // Creative & Alternative Models  
  'replicate.dall-e-clone': {
    key: 'replicate.dall-e-clone',
    name: 'DALL-E Style',
    description: 'DALL-E inspired creative and conceptual imagery',
    speed: 'medium',
    quality: 'high',
    specialty: 'Creative & Conceptual',
    cost: 'low'
  },
  'replicate.playground-v2': {
    key: 'replicate.playground-v2',
    name: 'Playground V2',
    description: 'Balanced model for creative experimentation',
    speed: 'fast',
    quality: 'high',
    specialty: 'Creative Playground',
    cost: 'low'
  },

  // Specialized Models
  'replicate.logo-diffusion': {
    key: 'replicate.logo-diffusion', 
    name: 'Logo Diffusion',
    description: 'Specialized for logo and brand design',
    speed: 'fast',
    quality: 'high',
    specialty: 'Logo & Branding',
    cost: 'low'
  },
  'replicate.interior-design': {
    key: 'replicate.interior-design',
    name: 'Interior Design',
    description: 'Architectural and interior design specialist',
    speed: 'medium',
    quality: 'high',
    specialty: 'Architecture & Interiors',
    cost: 'medium'
  },
  'replicate.fashion-diffusion': {
    key: 'replicate.fashion-diffusion',
    name: 'Fashion Diffusion',
    description: 'Fashion design and clothing generation',
    speed: 'medium',
    quality: 'high',
    specialty: 'Fashion & Clothing',
    cost: 'medium'
  },

  // Legacy Support
  'replicate.flux': {
    key: 'replicate.flux',
    name: 'Flux (Legacy)',
    description: 'Original Flux model - use Flux Schnell instead',
    speed: 'fast',
    quality: 'high',
    specialty: 'Legacy Support',
    cost: 'low'
  },
  'replicate.sd': {
    key: 'replicate.sd',
    name: 'SD XL (Legacy)',
    description: 'Legacy SDXL - use newer SDXL Base instead',
    speed: 'medium',
    quality: 'high',
    specialty: 'Legacy Support',
    cost: 'low'
  },
  'gemini.img': {
    key: 'gemini.img',
    name: 'Gemini Vision',
    description: 'Google\'s multimodal AI for smart image creation',
    speed: 'fast',
    quality: 'high',
    specialty: 'Smart Context Understanding',
    cost: 'medium'
  },
  'flux.pro': {
    key: 'flux.pro',
    name: 'Flux Pro (Direct)',
    description: 'Direct Flux Pro access - use Replicate version instead',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Direct API',
    cost: 'high'
  },
  'flux.ultra': {
    key: 'flux.ultra',
    name: 'Flux Ultra (Direct)',
    description: 'Direct Flux Ultra access - use Replicate version instead',
    speed: 'slow',
    quality: 'ultra',
    specialty: 'Direct API',
    cost: 'high'
  },
  'gemini.nano': {
    key: 'gemini.nano',
    name: 'Gemini Nano',
    description: 'Lightweight model for quick iterations',
    speed: 'fast',
    quality: 'standard',
    specialty: 'Rapid Prototyping',
    cost: 'low'
  },
  'openai.dall-e': {
    key: 'openai.dall-e',
    name: 'DALL-E 3',
    description: 'OpenAI\'s creative powerhouse for imaginative images',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Creative & Conceptual',
    cost: 'high'
  }
};

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: { prompt: string; style: string; quality: string; model: string; negativePrompt?: string; seed?: number }) => void;
}

export function AIGenerationModal({ isOpen, onClose, onGenerate }: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [quality, setQuality] = useState('high');
  const [selectedModel, setSelectedModel] = useState('replicate.flux-schnell');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seed, setSeed] = useState<number | undefined>();

  const availableModels = Object.keys(providers.imageGen) as Array<keyof typeof providers.imageGen>;

  if (!isOpen) return null;

  const styles = [
    { id: 'photorealistic', name: 'Photorealistic', preview: '/api/placeholder/80/80' },
    { id: 'cinematic', name: 'Cinematic', preview: '/api/placeholder/80/80' },
    { id: 'anime', name: 'Anime', preview: '/api/placeholder/80/80' },
    { id: 'digital-art', name: 'Digital Art', preview: '/api/placeholder/80/80' },
    { id: 'oil-painting', name: 'Oil Painting', preview: '/api/placeholder/80/80' },
    { id: 'watercolor', name: 'Watercolor', preview: '/api/placeholder/80/80' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const generatedAsset = await useAppStore.getState().generateDirectly(
        { 
          prompt, 
          negativePrompt: negativePrompt.trim() || undefined,
          seed: seed,
          style: selectedStyle,
          quality
        },
        selectedModel
      );
      
      if (generatedAsset) {
        // Save to AI gallery with metadata
        await useAppStore.getState().saveToAIGallery(generatedAsset, {
          prompt,
          model: selectedModel,
          parameters: { style: selectedStyle, quality, negativePrompt, seed },
          category: 'generated'
        });
        
        toast.success('Image generated and saved to gallery!');
        onClose();
      }
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate image');
    }
  };

  const getSpeedIcon = (speed: 'fast' | 'medium' | 'slow') => {
    switch (speed) {
      case 'fast': return <Zap className="h-3 w-3 text-green-500" />;
      case 'medium': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'slow': return <Clock className="h-3 w-3 text-red-500" />;
    }
  };

  const getCostIcon = (cost: 'low' | 'medium' | 'high') => {
    switch (cost) {
      case 'low': return <DollarSign className="h-3 w-3 text-green-500" />;
      case 'medium': return <DollarSign className="h-3 w-3 text-yellow-500" />;
      case 'high': return <DollarSign className="h-3 w-3 text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center">
            <SparklesIcon className="mr-2 h-5 w-5 text-primary" />
            AI Image Generation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Model Selection</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model">
                  {MODEL_INFO[selectedModel] && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{MODEL_INFO[selectedModel].name}</span>
                        <span className="text-xs text-muted-foreground">{MODEL_INFO[selectedModel].specialty}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSpeedIcon(MODEL_INFO[selectedModel].speed)}
                        {getCostIcon(MODEL_INFO[selectedModel].cost)}
                        <div className="flex items-center space-x-1">
                          {Array.from({ 
                            length: MODEL_INFO[selectedModel].quality === 'ultra' ? 3 : 
                                   MODEL_INFO[selectedModel].quality === 'high' ? 2 : 1 
                          }).map((_, i) => (
                            <div key={i} className="w-1 h-3 bg-primary rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-96 bg-popover border border-border">
                {MODEL_CATEGORIES.map((category) => (
                  <div key={category.name}>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {category.name}
                    </div>
                    {category.models.map((modelKey) => {
                      const model = MODEL_INFO[modelKey];
                      if (!model || !availableModels.includes(modelKey as any)) return null;
                      
                      return (
                        <SelectItem key={modelKey} value={modelKey} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col items-start">
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-muted-foreground">{model.description}</div>
                              <div className="text-xs text-primary mt-1">{model.specialty}</div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {getSpeedIcon(model.speed)}
                              {getCostIcon(model.cost)}
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: model.quality === 'ultra' ? 3 : model.quality === 'high' ? 2 : 1 }).map((_, i) => (
                                  <div key={i} className="w-1 h-3 bg-primary rounded-full" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="w-full h-24 px-3 py-2 bg-muted border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium mb-2">Negative Prompt (Optional)</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What you don't want in the image..."
                className="w-full h-16 px-3 py-2 bg-muted border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium mb-2">Seed (Optional)</label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random seed for reproducible results"
                className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <div className="grid grid-cols-3 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border text-center hover:bg-muted transition-colors ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="w-full h-16 bg-muted rounded-md mb-2 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-xs font-medium">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings className="mr-2 h-4 w-4 inline" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-muted rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate with {MODEL_INFO[selectedModel]?.name || 'Selected Model'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
