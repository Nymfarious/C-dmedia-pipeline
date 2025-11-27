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
  metadata?: Record<string, any>;
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
      events: [newEvent, ...state.events],
    }));
  },
  clearEvents: () => set({ events: [] }),
}));

// Helper function to record pipeline events
export function recordPipelineEvent(data: Omit<PipelineEvent, 'id' | 'timestamp'>) {
  usePipelineStore.getState().addEvent(data);
}
