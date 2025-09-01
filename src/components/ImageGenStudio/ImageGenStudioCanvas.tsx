import React from 'react';
import { Wand2, ZapIcon } from 'lucide-react';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { PromptSettingsPanel } from './PromptSettingsPanel';
import { ImageCarouselPanel } from './ImageCarouselPanel';
import { useImageGenStudioStore } from '@/store/imageGenStudioStore';
import { useAppStore } from '@/store/appStore';
import { geminiNanoAdapter } from '@/adapters/image-gen/geminiNano';
import { toast } from 'sonner';

export function ImageGenStudioCanvas() {
  const { 
    buildAssetPrompt, 
    selectedStyle, 
    resolution,
    negativePrompt, 
    category,
    isGenerating,
    setIsGenerating,
    addGeneratedImage
  } = useImageGenStudioStore();
  
  const { addAsset } = useAppStore();

  const handleGenerate = async () => {
    const fullPrompt = buildAssetPrompt();
    
    if (!fullPrompt.trim()) {
      toast.error('Please add assets or enter a prompt');
      return;
    }

    setIsGenerating(true);
    
    try {
      const generatedAsset = await geminiNanoAdapter.generate({
        prompt: fullPrompt,
        negativePrompt
      });

      // Add category to the asset
      const categorizedAsset = {
        ...generatedAsset,
        category,
        subcategory: 'ImageGen Studio'
      };

      addGeneratedImage(categorizedAsset);
      addAsset(categorizedAsset);
      
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-canvas-bg text-foreground">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center bg-gradient-primary bg-clip-text text-transparent">
            <Wand2 className="mr-2 text-primary" />
            ImageGen Studio
          </h1>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2 bg-gradient-primary rounded-lg hover:opacity-90 transition-all shadow-card hover:shadow-pipeline flex items-center font-medium disabled:opacity-50"
          >
            <ZapIcon size={18} className="mr-2" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row flex-1 p-4 gap-6 max-w-7xl mx-auto w-full">
        <AssetLibraryPanel />
        <PromptSettingsPanel />
      </main>

      {/* Generated Images Footer */}
      <footer className="p-6 border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <ImageCarouselPanel />
        </div>
      </footer>
    </div>
  );
}