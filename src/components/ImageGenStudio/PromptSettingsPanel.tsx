import React from 'react';
import { Sliders, Sparkles, MessageSquare, Zap, SlidersHorizontal, Bookmark } from 'lucide-react';
import { useImageGenStudioStore } from '@/store/imageGenStudioStore';
import { useAppStore } from '@/store/appStore';

export function PromptSettingsPanel() {
  const {
    selectedStyle,
    resolution,
    prompt,
    negativePrompt,
    category,
    buildAssetPrompt,
    setStyle,
    setResolution,
    setPrompt,
    setNegativePrompt,
    setCategory
  } = useImageGenStudioStore();

  const { allCategories } = useAppStore();

  const styles = [
    { key: 'realistic' as const, label: 'Realistic' },
    { key: 'cartoon' as const, label: 'Cartoon' },
    { key: 'anime' as const, label: 'Anime' },
    { key: 'abstract' as const, label: 'Abstract' }
  ];

  const resolutions = [
    '512x512',
    '1024x1024', 
    '1024x768'
  ];

  const enhancedPrompt = buildAssetPrompt();

  return (
    <div className="w-full lg:w-1/2 bg-card/50 backdrop-blur-sm rounded-xl p-5 flex flex-col shadow-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold flex items-center text-foreground">
          <Sliders className="mr-2 text-primary" size={20} />
          Settings & Prompts
        </h2>
        <div className="flex items-center space-x-2">
          <button className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
            Save preset
          </button>
          <button className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
            Load preset
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-5">
        {/* Style Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Style</label>
          <div className="grid grid-cols-2 gap-2">
            {styles.map(style => (
              <button
                key={style.key}
                onClick={() => setStyle(style.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedStyle === style.key
                    ? 'bg-primary/30 border border-primary text-primary-foreground'
                    : 'bg-secondary border border-border hover:bg-secondary/80'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground flex items-center">
            <SlidersHorizontal size={14} className="mr-1 text-primary" />
            Resolution
          </label>
          <select 
            value={resolution}
            onChange={(e) => setResolution(e.target.value as any)}
            className="w-full p-2 bg-input rounded-lg border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none"
          >
            {resolutions.map(res => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground flex items-center">
            <Bookmark size={14} className="mr-1 text-primary" />
            Category
          </label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-input rounded-lg border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none"
          >
            <option value="generated">Generated</option>
            {allCategories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Enhanced Prompt Preview */}
        {enhancedPrompt && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Enhanced Prompt Preview
            </label>
            <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground border border-border">
              {enhancedPrompt}
            </div>
          </div>
        )}

        {/* Main Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground flex items-center">
            <Sparkles className="mr-1 text-primary" size={14} />
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 bg-input rounded-lg border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none h-24"
            placeholder="Describe additional details for your generation..."
          />
          <div className="flex justify-end">
            <button className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors flex items-center">
              <Zap size={12} className="mr-1" />
              AI Assist
            </button>
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground flex items-center">
            <MessageSquare className="mr-1 text-primary" size={14} />
            Negative Prompt
          </label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full p-3 bg-input rounded-lg border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none h-16"
            placeholder="Elements to avoid in the generation..."
          />
        </div>
      </div>
    </div>
  );
}