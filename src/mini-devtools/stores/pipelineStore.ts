import { create } from 'zustand';

export type PipelineStep = 
  | 'generate_image' 
  | 'edit_image' 
  | 'remove_bg' 
  | 'upscale' 
  | 'animate' 
  | 'generate_tts';

export type PipelineProvider = 
  | 'gemini-2.5' 
  | 'firefly' 
  | 'replicate' 
  | 'rembg' 
  | 'esrgan' 
  | 'gcp-tts';

export interface PipelineEvent {
  id: string;
  step: PipelineStep;
  provider: PipelineProvider;
  duration: number; // milliseconds
  success: boolean;
  assetId?: string;
  metadata?: any;
  timestamp: Date;
}

interface PipelineStore {
  events: PipelineEvent[];
  addEvent: (event: Omit<PipelineEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  events: [],
  
  addEvent: (event) => {
    const newEvent: PipelineEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    
    set((state) => ({
      events: [newEvent, ...state.events].slice(0, 50), // Keep last 50 events
    }));
  },
  
  clearEvents: () => set({ events: [] }),
}));

// Helper function for recording pipeline events
export function recordPipelineEvent(data: Omit<PipelineEvent, 'id' | 'timestamp'>) {
  usePipelineStore.getState().addEvent(data);
}

// Add mock events on initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    recordPipelineEvent({
      step: 'generate_image',
      provider: 'gemini-2.5',
      duration: 2340,
      success: true,
      assetId: 'img-001',
      metadata: { prompt: 'A serene mountain landscape', resolution: '1024x1024' },
    });
    
    recordPipelineEvent({
      step: 'remove_bg',
      provider: 'rembg',
      duration: 890,
      success: true,
      assetId: 'img-001',
    });
    
    recordPipelineEvent({
      step: 'upscale',
      provider: 'esrgan',
      duration: 4500,
      success: true,
      assetId: 'img-001',
      metadata: { scale: 4 },
    });
  }, 1000);
}
