import { create } from 'zustand';
import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';
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

  generateTemplate: async () => {
    const { activeTemplate, templateInputs, templateAssets } = get();
    if (!activeTemplate) return null;

    try {
      // Import renderer
      const { renderPNG } = await import('@/compositor/renderer');
      
      // Create placement data
      const placement: TemplatePlacement = {
        variables: templateInputs,
        assets: templateAssets
      };

      // Render template
      const resultBuffer = await renderPNG(activeTemplate, placement);
      
      // Create blob and URL from result
      const blob = new Blob([resultBuffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      
      // Create asset from result
      const asset: Asset = {
        id: crypto.randomUUID(),
        type: 'image',
        name: `${activeTemplate.name} - ${new Date().toLocaleString()}`,
        src: url,
        createdAt: Date.now(),
        category: 'generated',
        subcategory: 'Template'
      };

      return asset;
    } catch (error) {
      console.error('Failed to generate template:', error);
      return null;
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