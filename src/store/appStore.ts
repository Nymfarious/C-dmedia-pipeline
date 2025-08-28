import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { Asset, PipelineStep } from '@/types/media';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';

interface AppState {
  assets: Record<string, Asset>;
  steps: Record<string, PipelineStep>;
  selectedAssetIds: string[];
  currentStepKind: PipelineStep["kind"];
  currentProviderKey: string;
  params: Record<string, any>;
  
  // Actions
  enqueueStep(kind: PipelineStep["kind"], inputAssetIds: string[], params: Record<string, any>, providerKey: string): string;
  runStep(stepId: string): Promise<void>;
  setSelected(ids: string[]): void;
  addAsset(a: Asset): void;
  setCurrentStepKind(kind: PipelineStep["kind"]): void;
  setCurrentProviderKey(key: string): void;
  setParams(params: Record<string, any>): void;
  persist(): Promise<void>;
  hydrate(): Promise<void>;
}

const useAppStore = create<AppState>((set, get) => ({
  assets: {},
  steps: {},
  selectedAssetIds: [],
  currentStepKind: "GENERATE",
  currentProviderKey: "replicate.sd",
  params: {},

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
        default:
          throw new Error(`Unknown step kind: ${step.kind}`);
      }

      // Success - add asset and update step
      set((state) => ({
        assets: { ...state.assets, [result.id]: result },
        steps: {
          ...state.steps,
          [stepId]: { 
            ...step, 
            status: "done", 
            outputAssetId: result.id,
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

  setSelected: (ids) => set({ selectedAssetIds: ids }),
  
  addAsset: (asset) => set((state) => ({
    assets: { ...state.assets, [asset.id]: asset }
  })),

  setCurrentStepKind: (kind) => set({ currentStepKind: kind }),
  
  setCurrentProviderKey: (key) => set({ currentProviderKey: key }),
  
  setParams: (params) => set({ params }),

  persist: async () => {
    const state = get();
    await idbSet('app-state', {
      assets: state.assets,
      steps: state.steps,
    });
  },

  hydrate: async () => {
    try {
      const stored = await idbGet('app-state');
      if (stored) {
        set({
          assets: stored.assets || {},
          steps: stored.steps || {},
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
    };
    
    assets[asset.id] = asset;
  }
  
  return assets;
}

export default useAppStore;