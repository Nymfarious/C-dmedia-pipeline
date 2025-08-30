import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { Asset, PipelineStep, CategoryInfo, DEFAULT_CATEGORIES, GalleryImage, GalleryMetadata } from '@/types/media';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';

interface AppState {
  assets: Record<string, Asset>;
  steps: Record<string, PipelineStep>;
  selectedAssetIds: string[];
  currentStepKind: PipelineStep["kind"];
  currentProviderKey: string;
  params: Record<string, any>;
  paramsByKey: Record<string, Record<string, any>>;
  categories: CategoryInfo[];
  customCategories: CategoryInfo[];
  allCategories: CategoryInfo[];
  galleryImages: GalleryImage[];
  canvases: Array<{ id: string; type: 'image' | 'video' | 'audio'; name: string; asset?: Asset; createdAt: number }>;
  activeCanvas: string | null;
  
  // Actions
  enqueueStep(kind: PipelineStep["kind"], inputAssetIds: string[], params: Record<string, any>, providerKey: string): string;
  runStep(stepId: string): Promise<void>;
  generateDirectly(params: Record<string, any>, providerKey: string): Promise<Asset>;
  setSelected(ids: string[]): void;
  addAsset(a: Asset): void;
  addAssets(assets: Asset[]): void;
  deleteAssets(ids: string[]): void;
  exportAssets(ids: string[]): Promise<{ name: string; blob: Blob }[]>;
  updateAssetCategory(assetId: string, category?: string, subcategory?: string): void;
  addCustomCategory(category: CategoryInfo): void;
  removeCustomCategory(categoryName: string): void;
  updateCustomCategory(categoryName: string, updatedCategory: CategoryInfo): void;
  setCurrentStepKind(kind: PipelineStep["kind"]): void;
  setCurrentProviderKey(key: string): void;
  setParams(params: Record<string, any>): void;
  saveToAIGallery(asset: Asset, metadata: GalleryMetadata): Promise<void>;
  removeFromGallery(id: string): void;
  toggleGalleryImageFavorite(id: string): void;
  createCanvas(type: 'image' | 'video' | 'audio', asset?: Asset): string;
  setActiveCanvas(canvasId: string | null): void;
  updateCanvasAsset(canvasId: string, asset: Asset): void;
  persist(): Promise<void>;
  hydrate(): Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  assets: {},
  steps: {},
  selectedAssetIds: [],
  currentStepKind: "GENERATE",
  currentProviderKey: "replicate.flux",
  params: {},
  paramsByKey: {},
  categories: DEFAULT_CATEGORIES,
  customCategories: [],
  galleryImages: [],
  canvases: [],
  activeCanvas: null,
  get allCategories() {
    return [...this.categories, ...this.customCategories];
  },

  enqueueStep: (kind, inputAssetIds, params, providerKey) => {
    const stepId = crypto.randomUUID();
    const step: PipelineStep = {
      id: stepId,
      kind,
      inputAssetIds,
      params,
      provider: providerKey,
      status: "queued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      steps: { ...state.steps, [stepId]: step }
    }));

    return stepId;
  },

  runStep: async (stepId) => {
    const state = get();
    const step = state.steps[stepId];
    if (!step) return;

    // Update to running
    set((state) => ({
      steps: {
        ...state.steps,
        [stepId]: { ...step, status: "running", updatedAt: Date.now() }
      }
    }));

    try {
      let result: Asset;
      const inputAssets = step.inputAssetIds.map(id => state.assets[id]).filter(Boolean);

      switch (step.kind) {
        case "GENERATE": {
          const adapter = providers.imageGen[step.provider as keyof typeof providers.imageGen];
          if (!adapter) throw new Error(`Provider ${step.provider} not found`);
          result = await adapter.generate(step.params as any);
          break;
        }
        case "EDIT": {
          const adapter = providers.imageEdit[step.provider as keyof typeof providers.imageEdit];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.edit(inputAssets[0], step.params as any);
          break;
        }
        case "ADD_TEXT": {
          const adapter = providers.textOverlay[step.provider as keyof typeof providers.textOverlay];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.addText(inputAssets[0], step.params as any);
          break;
        }
        case "ANIMATE": {
          const adapter = providers.animate[step.provider as keyof typeof providers.animate];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.animate(inputAssets[0], step.params as any);
          break;
        }
        case "ADD_SOUND": {
          const adapter = providers.sound[step.provider as keyof typeof providers.sound];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.addSound(inputAssets[0], step.params as any);
          break;
        }
        case "UPSCALE": {
          const adapter = providers.imageEdit[step.provider as keyof typeof providers.imageEdit];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.edit(inputAssets[0], { instruction: 'upscale this image to higher resolution' });
          break;
        }
        case "REMOVE_BG": {
          const adapter = providers.imageEdit[step.provider as keyof typeof providers.imageEdit];
          if (!adapter || !inputAssets[0]) throw new Error(`Provider ${step.provider} not found or no input asset`);
          result = await adapter.edit(inputAssets[0], { instruction: 'remove the background from this image' });
          break;
        }
        default:
          throw new Error(`Unknown step kind: ${step.kind}`);
      }

      // Auto-categorize based on step kind
      const autoCategory = step.kind === 'GENERATE' ? 'generated' : 'edited';
      const categorizedResult = { 
        ...result, 
        category: autoCategory,
        subcategory: step.kind === 'GENERATE' ? 'AI Generated' : step.kind === 'UPSCALE' ? 'Upscaled' : step.kind === 'REMOVE_BG' ? 'Background Removed' : 'Enhanced'
      };

      // Success - add asset and update step
      set((state) => ({
        assets: { ...state.assets, [categorizedResult.id]: categorizedResult },
        steps: {
          ...state.steps,
          [stepId]: { 
            ...step, 
            status: "done", 
            outputAssetId: categorizedResult.id,
            updatedAt: Date.now() 
          }
        }
      }));

      await get().persist();
      toast.success(`${step.kind} completed successfully!`);

    } catch (error) {
      // Failure - update step with error
      set((state) => ({
        steps: {
          ...state.steps,
          [stepId]: { 
            ...step, 
            status: "failed", 
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: Date.now() 
          }
        }
      }));

      toast.error(`${step.kind} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  generateDirectly: async (params, providerKey) => {
    const stepId = get().enqueueStep("GENERATE", [], params, providerKey);
    await get().runStep(stepId);
    
    const step = get().steps[stepId];
    if (step.status === "done" && step.outputAssetId) {
      const asset = get().assets[step.outputAssetId];
      // Ensure asset is persisted
      await get().persist();
      return asset;
    }
    throw new Error(step.error || "Generation failed");
  },

  setSelected: (ids) => set({ selectedAssetIds: ids }),
  
  addAsset: (asset) => {
    set((state) => ({
      assets: { ...state.assets, [asset.id]: asset }
    }));
    // Auto-persist after adding asset
    get().persist();
  },

  addAssets: (assets) => set((state) => {
    const newAssets = { ...state.assets };
    assets.forEach(asset => {
      newAssets[asset.id] = asset;
    });
    return { assets: newAssets };
  }),

  deleteAssets: (ids) => set((state) => {
    const newAssets = { ...state.assets };
    const newSelected = state.selectedAssetIds.filter(id => !ids.includes(id));
    
    // Revoke blob URLs to prevent memory leaks
    ids.forEach(id => {
      const asset = state.assets[id];
      if (asset && asset.src.startsWith('blob:')) {
        URL.revokeObjectURL(asset.src);
      }
      delete newAssets[id];
    });

    return { 
      assets: newAssets,
      selectedAssetIds: newSelected
    };
  }),

  exportAssets: async (ids) => {
    const state = get();
    const exports: { name: string; blob: Blob }[] = [];
    
    for (const id of ids) {
      const asset = state.assets[id];
      if (!asset) continue;
      
      try {
        let blob: Blob;
        if (asset.src.startsWith('blob:')) {
          const response = await fetch(asset.src);
          blob = await response.blob();
        } else {
          const response = await fetch(asset.src);
          blob = await response.blob();
        }
        
        exports.push({
          name: asset.name || `asset-${id}`,
          blob
        });
      } catch (error) {
        console.error(`Failed to export asset ${id}:`, error);
      }
    }
    
    return exports;
  },

  updateAssetCategory: (assetId, category, subcategory) => set((state) => {
    const asset = state.assets[assetId];
    if (!asset) return state;
    
    return {
      assets: {
        ...state.assets,
        [assetId]: {
          ...asset,
          category,
          subcategory
        }
      }
    };
  }),

  addCustomCategory: (category) => set((state) => ({
    customCategories: [...state.customCategories, category]
  })),

  removeCustomCategory: (categoryName) => set((state) => ({
    customCategories: state.customCategories.filter(cat => cat.name !== categoryName)
  })),

  updateCustomCategory: (categoryName, updatedCategory) => set((state) => ({
    customCategories: state.customCategories.map(cat =>
      cat.name === categoryName ? updatedCategory : cat
    )
  })),

  setCurrentStepKind: (kind) => {
    const state = get();
    // Save current params before switching
    const currentKey = `${state.currentStepKind}::${state.currentProviderKey}`;
    const newParamsByKey = { ...state.paramsByKey, [currentKey]: state.params };
    
    // Load params for new step/provider combo
    const newKey = `${kind}::${state.currentProviderKey}`;
    const newParams = newParamsByKey[newKey] || {};
    
    set({ 
      currentStepKind: kind, 
      params: newParams,
      paramsByKey: newParamsByKey
    });
  },
  
  setCurrentProviderKey: (key) => {
    const state = get();
    // Save current params before switching
    const currentKey = `${state.currentStepKind}::${state.currentProviderKey}`;
    const newParamsByKey = { ...state.paramsByKey, [currentKey]: state.params };
    
    // Load params for new step/provider combo
    const newKey = `${state.currentStepKind}::${key}`;
    const newParams = newParamsByKey[newKey] || {};
    
    set({ 
      currentProviderKey: key, 
      params: newParams,
      paramsByKey: newParamsByKey
    });
  },
  
  setParams: (params) => {
    const state = get();
    const key = `${state.currentStepKind}::${state.currentProviderKey}`;
    set({ 
      params,
      paramsByKey: { ...state.paramsByKey, [key]: params }
    });
  },

  // Gallery management
  saveToAIGallery: async (asset: Asset, metadata: GalleryMetadata) => {
    try {
      // Download and upload the image to cloud storage
      const { uploadAsset, downloadAndUploadImage } = await import('@/lib/assetStorage');
      
      let cloudUrl = asset.src;
      if (asset.src && !asset.src.includes('supabase')) {
        // If it's an external URL, download and upload to our storage
        const uploadResult = await downloadAndUploadImage(
          asset.src, 
          `gallery-${Date.now()}.webp`
        );
        if (uploadResult.url) {
          cloudUrl = uploadResult.url;
        }
      }

      const galleryImage: GalleryImage = {
        id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: cloudUrl,
        prompt: metadata.prompt,
        model: metadata.model,
        parameters: metadata.parameters,
        category: metadata.category,
        favorite: false,
        created: new Date().toLocaleString(),
        createdAt: Date.now()
      };

      set((state) => ({
        galleryImages: [galleryImage, ...state.galleryImages]
      }));

      await get().persist();
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      throw error;
    }
  },

  removeFromGallery: (id: string) => {
    set((state) => ({
      galleryImages: state.galleryImages.filter(img => img.id !== id)
    }));
    get().persist();
  },

  toggleGalleryImageFavorite: (id: string) => {
    set((state) => ({
      galleryImages: state.galleryImages.map(img => 
        img.id === id ? { ...img, favorite: !img.favorite } : img
      )
    }));
    get().persist();
  },

  createCanvas: (type, asset) => {
    const canvasId = crypto.randomUUID();
    const newCanvas = {
      id: canvasId,
      type,
      name: asset ? asset.name : `New ${type} canvas`,
      asset,
      createdAt: Date.now(),
    };
    
    set((state) => ({
      canvases: [...state.canvases, newCanvas],
      activeCanvas: canvasId
    }));
    
    get().persist();
    return canvasId;
  },

  setActiveCanvas: (canvasId) => {
    set({ activeCanvas: canvasId });
    get().persist();
  },

  updateCanvasAsset: (canvasId, asset) => {
    set((state) => ({
      canvases: state.canvases.map(canvas =>
        canvas.id === canvasId ? { ...canvas, asset, name: asset.name } : canvas
      )
    }));
    get().persist();
  },

  persist: async () => {
    const state = get();
    await idbSet('app-state', {
      assets: state.assets,
      steps: state.steps,
      paramsByKey: state.paramsByKey,
      galleryImages: state.galleryImages,
      canvases: state.canvases,
      activeCanvas: state.activeCanvas,
    });
  },

  hydrate: async () => {
    try {
      const stored = await idbGet('app-state');
      if (stored) {
        set({
          assets: stored.assets || {},
          steps: stored.steps || {},
          paramsByKey: stored.paramsByKey || {},
          galleryImages: stored.galleryImages || [],
          canvases: stored.canvases || [],
          activeCanvas: stored.activeCanvas || null,
        });
      }
      
      // Add demo assets if none exist
      const state = get();
      if (Object.keys(state.assets).length === 0) {
        const demoAssets = await createDemoAssets();
        set({ assets: demoAssets });
        await get().persist();
      }
    } catch (error) {
      console.error('Failed to hydrate state:', error);
    }
  },
}));

// Create demo assets for initial state
async function createDemoAssets(): Promise<Record<string, Asset>> {
  // Create simple colored demo images
  const assets: Record<string, Asset> = {};
  
  const colors = ['#8B5CF6', '#06B6D4'];
  const names = ['Demo Purple', 'Demo Cyan'];
  
  for (let i = 0; i < 2; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, colors[i]);
    gradient.addColorStop(1, colors[i] + '80');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some visual interest
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let j = 0; j < 20; j++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 50 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    const asset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: names[i],
      src: URL.createObjectURL(blob),
      meta: { width: 512, height: 512 },
      createdAt: Date.now() - (i * 1000),
      category: 'uploaded',
      subcategory: 'Demo',
    };
    
    assets[asset.id] = asset;
  }
  
  return assets;
}

export default useAppStore;