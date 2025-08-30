import React, { useState } from 'react';
import { X, SparklesIcon, ImageIcon, Settings, Wand2, Clock, Zap, Palette, DollarSign } from 'lucide-react';
import { providers } from '@/adapters/registry';

interface ModelInfo {
  key: string;
  name: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'ultra';
  specialty: string;
  cost: 'low' | 'medium' | 'high';
}

const MODEL_INFO: Record<string, ModelInfo> = {
  'replicate.flux': {
    key: 'replicate.flux',
    name: 'Flux Schnell',
    description: 'Lightning-fast image generation with good quality',
    speed: 'fast',
    quality: 'high',
    specialty: 'Speed & Versatility',
    cost: 'medium'
  },
  'flux.pro': {
    key: 'flux.pro',
    name: 'Flux Pro',
    description: 'Professional-grade images with excellent detail',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Professional Photography',
    cost: 'high'
  },
  'flux.ultra': {
    key: 'flux.ultra',
    name: 'Flux Ultra',
    description: 'Ultimate quality for artistic and creative work',
    speed: 'slow',
    quality: 'ultra',
    specialty: 'Artistic & Creative',
    cost: 'high'
  },
  'openai.dall-e': {
    key: 'openai.dall-e',
    name: 'DALL-E 3',
    description: 'OpenAI\'s creative powerhouse for imaginative images',
    speed: 'medium',
    quality: 'ultra',
    specialty: 'Creative & Conceptual',
    cost: 'high'
  },
  'replicate.sd': {
    key: 'replicate.sd',
    name: 'Stable Diffusion XL',
    description: 'Reliable and customizable image generation',
    speed: 'medium',
    quality: 'high',
    specialty: 'Customization & Control',
    cost: 'low'
  },
  'huggingface.flux': {
    key: 'huggingface.flux',
    name: 'HuggingFace Flux',
    description: 'Free open-source model with good results',
    speed: 'fast',
    quality: 'standard',
    specialty: 'Budget-Friendly',
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
  'gemini.nano': {
    key: 'gemini.nano',
    name: 'Gemini Nano',
    description: 'Lightweight model for quick iterations',
    speed: 'fast',
    quality: 'standard',
    specialty: 'Rapid Prototyping',
    cost: 'low'
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
  const [selectedModel, setSelectedModel] = useState('replicate.flux');
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

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate({ 
        prompt, 
        style: selectedStyle, 
        quality, 
        model: selectedModel,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed
      });
      onClose();
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
            <div className="grid grid-cols-1 gap-2 mb-4">
              {availableModels.map((modelKey) => {
                const model = MODEL_INFO[modelKey];
                if (!model) return null;
                
                return (
                  <button
                    key={modelKey}
                    onClick={() => setSelectedModel(modelKey)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedModel === modelKey
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                        <div className="text-xs text-primary mt-1">{model.specialty}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSpeedIcon(model.speed)}
                        {getCostIcon(model.cost)}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: model.quality === 'ultra' ? 3 : model.quality === 'high' ? 2 : 1 }).map((_, i) => (
                            <div key={i} className="w-1 h-3 bg-primary rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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