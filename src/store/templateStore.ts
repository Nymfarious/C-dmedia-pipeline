import { create } from 'zustand';
import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';
import { TemplateRenderer } from '@/compositor/templateRenderer';
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
      // Create a temporary canvas for rendering
      const canvas = document.createElement('canvas');
      const renderer = new TemplateRenderer(canvas);

      // Create placement object from current state
      const placement = {
        variables: state.templateInputs,
        assets: state.templateAssets
      };

      // Generate the asset
      const asset = await renderer.generateAsset(state.activeTemplate, placement);
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