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
  activeTool: string;
  inpaintingMode: boolean;
  
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
  deleteCanvas(canvasId: string): void;
  deleteAllCanvases(): void;
  setActiveCanvas(canvasId: string | null): void;
  updateCanvasAsset(canvasId: string, asset: Asset): void;
  getActiveCanvasWithAsset(): { id: string; type: 'image' | 'video' | 'audio'; name: string; asset: Asset; createdAt: number } | null;
  clearWorkspace(): void;
  loadProjectData(assets: Record<string, Asset>, currentAssetId?: string): void;
  setActiveTool(tool: string): void;
  setInpaintingMode(enabled: boolean): void;
  exitActiveTool(): void;
  persist(): Promise<void>;
  hydrate(): Promise<void>;
  migrateExpiredAssets(): Promise<void>;
  isHydrating: boolean;
  cleanupOldCanvases(): void;
  getStorageUsage(): Promise<{ canvases: number; assets: number; steps: number }>;
  optimizeStorage(): Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  assets: {},
  steps: {},
  selectedAssetIds: [],
  currentStepKind: "GENERATE",
  currentProviderKey: "replicate.flux",
  params: {},
  paramsByKey: {},
  categories: DEFAULT_CATEGORIES,
  customCategories: [],
  allCategories: DEFAULT_CATEGORIES, // Initialize as static array
  galleryImages: [],
  canvases: [],
  activeCanvas: null,
  activeTool: 'select',
  inpaintingMode: false,
  isHydrating: false,

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

  addAssets: (assets) => {
    set((state) => {
      const newAssets = { ...state.assets };
      assets.forEach(asset => {
        newAssets[asset.id] = asset;
      });
      return { assets: newAssets };
    });
    // Auto-persist after adding assets
    get().persist();
  },

  deleteAssets: (ids) => {
    set((state) => {
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
    });
    // Auto-persist after deleting assets
    get().persist();
  },

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

  updateAssetCategory: (assetId, category, subcategory) => {
    set((state) => {
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
    });
    // Auto-persist after category update
    get().persist();
  },

  addCustomCategory: (category) => set((state) => ({
    customCategories: [...state.customCategories, category],
    allCategories: [...state.categories, ...state.customCategories, category]
  })),

  removeCustomCategory: (categoryName) => set((state) => {
    const newCustomCategories = state.customCategories.filter(cat => cat.name !== categoryName);
    return {
      customCategories: newCustomCategories,
      allCategories: [...state.categories, ...newCustomCategories]
    };
  }),

  updateCustomCategory: (categoryName, updatedCategory) => set((state) => {
    const newCustomCategories = state.customCategories.map(cat =>
      cat.name === categoryName ? updatedCategory : cat
    );
    return {
      customCategories: newCustomCategories,
      allCategories: [...state.categories, ...newCustomCategories]
    };
  }),

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
        type: asset.type,
        name: asset.name,
        src: cloudUrl,
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
    console.log('Store createCanvas called:', type, asset?.name);
    const canvasId = crypto.randomUUID();
    
    // Normalize canvas title to prevent duplication
    const normalizeTitle = (title: string) => {
      return title.replace(/^(FLUX Inpaint:\s*)+/i, "").trim();
    };
    
    const baseTitle = asset ? normalizeTitle(asset.name) : `New ${type} canvas`;
    
    const newCanvas = {
      id: canvasId,
      type,
      name: baseTitle,
      asset,
      createdAt: Date.now(),
    };
    
    set((state) => {
      // Auto-cleanup old canvases (keep only 20 most recent)
      const sortedCanvases = [...state.canvases].sort((a, b) => b.createdAt - a.createdAt);
      const canvasesToKeep = sortedCanvases.slice(0, 19); // Keep 19 + new one = 20
      
      return {
        canvases: [...canvasesToKeep, newCanvas],
        activeCanvas: canvasId
      };
    });
    
    // Auto-persist after canvas creation
    get().persist();
    
    return canvasId;
  },

  deleteCanvas: (canvasId) => {
    const state = get();
    const canvas = state.canvases.find(c => c.id === canvasId);
    
    if (!canvas) return;
    
    // If deleting active canvas, switch to another or null
    let newActiveCanvas = state.activeCanvas;
    if (state.activeCanvas === canvasId) {
      const otherCanvases = state.canvases.filter(c => c.id !== canvasId);
      newActiveCanvas = otherCanvases.length > 0 ? otherCanvases[0].id : null;
    }
    
    set({
      canvases: state.canvases.filter(c => c.id !== canvasId),
      activeCanvas: newActiveCanvas
    });
    
    // Auto-persist after canvas deletion
    get().persist();
    
    toast.success(`Deleted canvas: ${canvas.name}`);
  },

  deleteAllCanvases: () => {
    const state = get();
    const count = state.canvases.length;
    
    if (count === 0) return;
    
    set({
      canvases: [],
      activeCanvas: null
    });
    
    // Auto-persist after clearing all canvases
    get().persist();
    
    toast.success(`Deleted ${count} canvas${count !== 1 ? 'es' : ''}`);
  },

  setActiveCanvas: (canvasId) => {
    const current = get().activeCanvas;
    if (current === canvasId) return; // Prevent redundant updates
    console.log('Store setActiveCanvas called:', canvasId);
    set({ activeCanvas: canvasId });
  },

  updateCanvasAsset: (canvasId, asset) => {
    console.log('Store updateCanvasAsset called:', canvasId, asset.name);
    
    // Normalize asset name to prevent title duplication
    const normalizeTitle = (title: string) => {
      return title.replace(/^(FLUX Inpaint:\s*)+/i, "").trim();
    };
    
    const normalizedName = normalizeTitle(asset.name);
    
    set((state) => ({
      canvases: state.canvases.map(canvas =>
        canvas.id === canvasId ? { 
          ...canvas, 
          asset: { ...asset, name: normalizedName }, 
          name: normalizedName 
        } : canvas
      )
    }));
  },

  getActiveCanvasWithAsset: () => {
    const state = get();
    if (!state.activeCanvas) return null;
    const canvas = state.canvases.find(c => c.id === state.activeCanvas);
    return canvas && canvas.asset ? canvas as { id: string; type: 'image' | 'video' | 'audio'; name: string; asset: Asset; createdAt: number } : null;
  },

  clearWorkspace: () => {
    set({
      assets: {},
      steps: {},
      selectedAssetIds: [],
      canvases: [],
      activeCanvas: null,
      galleryImages: [],
    });
    get().persist();
  },

  loadProjectData: (assets, currentAssetId) => {
    set({
      assets,
      selectedAssetIds: currentAssetId ? [currentAssetId] : [],
      canvases: [],
      activeCanvas: null,
    });
    
    // If there's a current asset, create a canvas for it
    if (currentAssetId && assets[currentAssetId]) {
      const asset = assets[currentAssetId];
      const canvasId = get().createCanvas(asset.type as 'image' | 'video' | 'audio', asset);
    }
    
    get().persist();
  },

  setActiveTool: (tool) => {
    const current = get().activeTool;
    if (current === tool) return; // Prevent redundant updates
    
    console.log('🔧 AppStore - Setting active tool:', tool);
    console.log('🔧 AppStore - Previous state:', { activeTool: get().activeTool, inpaintingMode: get().inpaintingMode });
    
    // Set tool and inpaintingmode atomically
    if (tool === 'inpaint') {
      console.log('🎨 AppStore - Enabling inpainting mode');
      set({ activeTool: tool, inpaintingMode: true });
      console.log('✅ AppStore - Inpainting enabled. New state:', { activeTool: get().activeTool, inpaintingMode: get().inpaintingMode });
    } else {
      console.log('🔄 AppStore - Disabling inpainting mode for tool:', tool);
      set({ activeTool: tool, inpaintingMode: false });
      console.log('✅ AppStore - Tool changed. New state:', { activeTool: get().activeTool, inpaintingMode: get().inpaintingMode });
    }
  },

  setInpaintingMode: (enabled) => {
    const current = get().inpaintingMode;
    if (current === enabled) return; // Prevent redundant updates
    set({ inpaintingMode: enabled });
  },

  exitActiveTool: () => {
    console.log('🚪 AppStore - Exiting active tool');
    set({ activeTool: 'select', inpaintingMode: false });
    console.log('✅ AppStore - Returned to default state');
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
      // Prevent multiple simultaneous hydrations
      if (get().isHydrating) {
        console.log('⏭️ Hydration already in progress, skipping...');
        return;
      }
      
      set({ isHydrating: true });
      
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
      
      // Automatically optimize storage on startup (debounced)
      setTimeout(async () => {
        await get().optimizeStorage();
        set({ isHydrating: false });
      }, 100);
      
    } catch (error) {
      console.error('Failed to hydrate state:', error);
      set({ isHydrating: false });
    }
  },

  migrateExpiredAssets: async () => {
    // Debounce migration attempts - only run if not attempted in last 30 seconds
    const lastMigrationKey = 'last-migration-attempt';
    const now = Date.now();
    const lastAttempt = localStorage.getItem(lastMigrationKey);
    
    if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
      console.log('⏭️ Skipping migration - too soon since last attempt');
      return;
    }
    
    localStorage.setItem(lastMigrationKey, now.toString());
    
    const { analyzeAssets, migrateAsset } = await import('@/utils/assetMigration');
    const state = get();
    const assetsArray = Object.values(state.assets);
    
    if (assetsArray.length === 0) return;
    
    const analysis = analyzeAssets(assetsArray);
    if (analysis.needsMigration === 0) return;
    
    console.log(`🔄 Migrating ${analysis.needsMigration} expired assets...`);
    
    let migratedCount = 0;
    const migratedAssets: Record<string, Asset> = { ...state.assets };
    
    for (const expiredAsset of analysis.expired) {
      try {
        const migratedAsset = await migrateAsset(expiredAsset);
        if (migratedAsset) {
          migratedAssets[migratedAsset.id] = migratedAsset;
          migratedCount++;
        }
      } catch (error) {
        console.error(`Failed to migrate asset ${expiredAsset.id}:`, error);
      }
    }
    
    if (migratedCount > 0) {
      set({ assets: migratedAssets });
      await get().persist();
      console.log(`✅ Successfully migrated ${migratedCount} assets`);
      
      // Show user-friendly notification
      const { useToastManager } = await import('@/hooks/useToastManager');
      const { showMigrationSuccess } = useToastManager();
      showMigrationSuccess(migratedCount);
    }
  },

  cleanupOldCanvases: () => {
    set((state) => {
      const sortedCanvases = [...state.canvases].sort((a, b) => b.createdAt - a.createdAt);
      const canvasesToKeep = sortedCanvases.slice(0, 20);
      
      if (canvasesToKeep.length < state.canvases.length) {
        console.log(`🧹 Cleaned up ${state.canvases.length - canvasesToKeep.length} old canvases`);
        return { canvases: canvasesToKeep };
      }
      return state;
    });
  },

  getStorageUsage: async () => {
    const state = get();
    return {
      canvases: state.canvases.length,
      assets: Object.keys(state.assets).length,
      steps: Object.keys(state.steps).length,
    };
  },

  optimizeStorage: async () => {
    const state = get();
    
    // Clean up old canvases
    get().cleanupOldCanvases();
    
    // Clean up failed/old steps (keep only last 50)
    const sortedSteps = Object.values(state.steps)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 50);
    
    const optimizedSteps: Record<string, PipelineStep> = {};
    sortedSteps.forEach(step => {
      optimizedSteps[step.id] = step;
    });
    
    // Migrate expired assets
    await get().migrateExpiredAssets();
    
    set({ steps: optimizedSteps });
    await get().persist();
    
    console.log('🧹 Storage optimized: canvases limited to 20, steps limited to 50, expired assets migrated');
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