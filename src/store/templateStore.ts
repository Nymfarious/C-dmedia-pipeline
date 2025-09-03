import { create } from 'zustand';
import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';
import { TemplateRenderer } from '@/compositor/templateRenderer';
import { generateTemplateWithAI } from '@/utils/templateGeneration';
import { Asset } from '@/types/media';

interface TemplateState {
  activeTemplate: TemplateSpec | null;
  templateInputs: Record<string, any>;
  isTemplateMode: boolean;
  templateAssets: Record<string, Asset>;
  
  // Actions
  setActiveTemplate: (template: TemplateSpec | null) => void;
  updateTemplateInput: (key: string, value: any) => void;
  setTemplateMode: (enabled: boolean) => void;
  assignAssetToTemplate: (inputKey: string, asset: Asset) => void;
  generateTemplate: () => Promise<Asset | null>;
  resetTemplate: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  activeTemplate: null,
  templateInputs: {},
  isTemplateMode: false,
  templateAssets: {},

  setActiveTemplate: (template) => {
    set({
      activeTemplate: template,
      templateInputs: template?.inputs ? Object.keys(template.inputs).reduce((acc, key) => {
        const input = template.inputs![key];
        acc[key] = input.default || '';
        return acc;
      }, {} as Record<string, any>) : {},
      templateAssets: {}
    });
  },

  updateTemplateInput: (key, value) => {
    set((state) => ({
      templateInputs: { ...state.templateInputs, [key]: value }
    }));
  },

  setTemplateMode: (enabled) => {
    set({ isTemplateMode: enabled });
    if (!enabled) {
      get().resetTemplate();
    }
  },

  assignAssetToTemplate: (inputKey, asset) => {
    set((state) => ({
      templateAssets: { ...state.templateAssets, [inputKey]: asset }
    }));
  },

  generateTemplate: async (): Promise<Asset | null> => {
    const state = get();
    if (!state.activeTemplate) return null;

    try {
      console.log('Starting template generation:', state.activeTemplate.name);
      
      // Check if template needs AI processing (Nano Banana)
      const needsAIProcessing = state.activeTemplate.layers.some(layer => 
        layer.type === 'ai-image' || layer.type === 'ai-text'
      ) || state.activeTemplate.name.toLowerCase().includes('ai') || 
      Object.keys(state.templateAssets).length > 0; // Has user assets to process

      if (needsAIProcessing) {
        console.log('Using AI template processing with Nano Banana');
        return await generateTemplateWithAI(state.activeTemplate, {
          variables: state.templateInputs,
          assets: state.templateAssets
        });
      }

      // Fallback to local rendering for simple templates
      console.log('Using local template rendering');
      const canvas = document.createElement('canvas');
      const renderer = new TemplateRenderer(canvas);
      const asset = await renderer.generateAsset(state.activeTemplate, {
        variables: state.templateInputs,
        assets: state.templateAssets
      });
      return asset;
    } catch (error) {
      console.error('Template generation failed:', error);
      throw error;
    }
  },

  resetTemplate: () => {
    set({
      activeTemplate: null,
      templateInputs: {},
      templateAssets: {}
    });
  }
}));