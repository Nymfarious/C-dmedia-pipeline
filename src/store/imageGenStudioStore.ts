import { create } from 'zustand';
import { Asset } from '@/types/media';

interface ImageGenStudioState {
  // Selected assets for generation
  selectedAssets: Asset[];
  // Generation settings
  selectedStyle: 'realistic' | 'cartoon' | 'anime' | 'abstract';
  resolution: '512x512' | '1024x1024' | '1024x768';
  prompt: string;
  negativePrompt: string;
  category: string;
  // Generated images
  generatedImages: Asset[];
  selectedImageIndex: number;
  // UI state
  isGenerating: boolean;
  
  // Actions
  addSelectedAsset: (asset: Asset) => void;
  removeSelectedAsset: (assetId: string) => void;
  clearSelectedAssets: () => void;
  setStyle: (style: 'realistic' | 'cartoon' | 'anime' | 'abstract') => void;
  setResolution: (resolution: '512x512' | '1024x1024' | '1024x768') => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setCategory: (category: string) => void;
  addGeneratedImage: (asset: Asset) => void;
  setSelectedImageIndex: (index: number) => void;
  setIsGenerating: (generating: boolean) => void;
  buildAssetPrompt: () => string;
  reset: () => void;
}

export const useImageGenStudioStore = create<ImageGenStudioState>((set, get) => ({
  selectedAssets: [],
  selectedStyle: 'realistic',
  resolution: '1024x1024',
  prompt: '',
  negativePrompt: '',
  category: 'generated',
  generatedImages: [],
  selectedImageIndex: 0,
  isGenerating: false,

  addSelectedAsset: (asset) => {
    set((state) => {
      if (state.selectedAssets.find(a => a.id === asset.id)) return state;
      return { selectedAssets: [...state.selectedAssets, asset] };
    });
  },

  removeSelectedAsset: (assetId) => {
    set((state) => ({
      selectedAssets: state.selectedAssets.filter(a => a.id !== assetId)
    }));
  },

  clearSelectedAssets: () => set({ selectedAssets: [] }),

  setStyle: (selectedStyle) => set({ selectedStyle }),
  setResolution: (resolution) => set({ resolution }),
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setCategory: (category) => set({ category }),

  addGeneratedImage: (asset) => {
    set((state) => ({
      generatedImages: [asset, ...state.generatedImages],
      selectedImageIndex: 0
    }));
  },

  setSelectedImageIndex: (selectedImageIndex) => set({ selectedImageIndex }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  buildAssetPrompt: () => {
    const state = get();
    const assetDescriptions = state.selectedAssets.map(asset => {
      const categoryType = asset.category || 'element';
      return `${categoryType}: ${asset.name || 'asset'}`;
    });
    
    return assetDescriptions.length > 0 
      ? assetDescriptions.join(', ') + (state.prompt ? `, ${state.prompt}` : '')
      : state.prompt;
  },

  reset: () => set({
    selectedAssets: [],
    selectedStyle: 'realistic',
    resolution: '1024x1024',
    prompt: '',
    negativePrompt: '',
    category: 'generated',
    generatedImages: [],
    selectedImageIndex: 0,
    isGenerating: false
  })
}));