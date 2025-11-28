import { create } from 'zustand';

export interface Clip {
  id: string;
  trackType: 'visual' | 'audio' | 'fx';
  startTime: number; // in seconds
  duration: number; // in seconds
  label: string;
  assetId?: string;
  thumbnail?: string;
}

interface TimelineState {
  clips: Clip[];
  selectedClipId: string | null;
  playheadPosition: number; // in seconds
  snapInterval: number; // in seconds, 0 = off
  zoom: number; // pixels per second
  isPlaying: boolean;
  isLooping: boolean;
  duration: number; // total timeline duration in seconds
  activeTool: 'select' | 'cut' | 'mend';
  
  // Actions
  addClip: (clip: Omit<Clip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  setSelectedClip: (clipId: string | null) => void;
  setPlayheadPosition: (seconds: number) => void;
  setSnapInterval: (interval: number) => void;
  setZoom: (zoom: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setIsLooping: (isLooping: boolean) => void;
  setActiveTool: (tool: 'select' | 'cut' | 'mend') => void;
  cutClipAtPlayhead: () => void;
  mendClips: (clipId1: string, clipId2: string) => void;
  snapToGrid: (time: number) => number;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  clips: [],
  selectedClipId: null,
  playheadPosition: 0,
  snapInterval: 1, // 1 second default
  zoom: 20, // 20 pixels per second
  isPlaying: false,
  isLooping: false,
  duration: 120, // 2 minutes default
  activeTool: 'select',

  addClip: (clip) => {
    const id = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      clips: [...state.clips, { ...clip, id }],
    }));
  },

  removeClip: (clipId) => {
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== clipId),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    }));
  },

  updateClip: (clipId, updates) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId ? { ...c, ...updates } : c
      ),
    }));
  },

  setSelectedClip: (clipId) => {
    set({ selectedClipId: clipId });
  },

  setPlayheadPosition: (seconds) => {
    const { duration } = get();
    set({ playheadPosition: Math.max(0, Math.min(seconds, duration)) });
  },

  setSnapInterval: (interval) => {
    set({ snapInterval: interval });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(5, Math.min(100, zoom)) });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  togglePlayback: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setIsLooping: (isLooping) => {
    set({ isLooping });
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  cutClipAtPlayhead: () => {
    const { clips, playheadPosition, selectedClipId } = get();
    
    // Find clip under playhead (selected or any)
    const clipToCut = selectedClipId 
      ? clips.find(c => c.id === selectedClipId)
      : clips.find(c => 
          playheadPosition >= c.startTime && 
          playheadPosition < c.startTime + c.duration
        );
    
    if (!clipToCut) return;
    
    const cutPoint = playheadPosition - clipToCut.startTime;
    if (cutPoint <= 0.1 || cutPoint >= clipToCut.duration - 0.1) return; // Can't cut at edges
    
    const newClip1: Clip = {
      ...clipToCut,
      id: `clip-${Date.now()}-a`,
      duration: cutPoint,
    };
    
    const newClip2: Clip = {
      ...clipToCut,
      id: `clip-${Date.now()}-b`,
      startTime: playheadPosition,
      duration: clipToCut.duration - cutPoint,
      label: `${clipToCut.label} (2)`,
    };
    
    set((state) => ({
      clips: [
        ...state.clips.filter(c => c.id !== clipToCut.id),
        newClip1,
        newClip2,
      ],
      selectedClipId: null,
    }));
  },

  mendClips: (clipId1, clipId2) => {
    const { clips } = get();
    const clip1 = clips.find(c => c.id === clipId1);
    const clip2 = clips.find(c => c.id === clipId2);
    
    if (!clip1 || !clip2 || clip1.trackType !== clip2.trackType) return;
    
    // Find which clip comes first
    const [first, second] = clip1.startTime < clip2.startTime 
      ? [clip1, clip2] 
      : [clip2, clip1];
    
    // Check if clips are adjacent (within 0.1s)
    const gap = second.startTime - (first.startTime + first.duration);
    if (gap > 0.1) return;
    
    const mendedClip: Clip = {
      ...first,
      id: `clip-${Date.now()}-mend`,
      duration: (second.startTime + second.duration) - first.startTime,
      label: first.label.replace(/ \(\d+\)$/, ''),
    };
    
    set((state) => ({
      clips: [
        ...state.clips.filter(c => c.id !== clipId1 && c.id !== clipId2),
        mendedClip,
      ],
      selectedClipId: mendedClip.id,
    }));
  },

  snapToGrid: (time) => {
    const { snapInterval } = get();
    if (snapInterval === 0) return time;
    return Math.round(time / snapInterval) * snapInterval;
  },
}));
