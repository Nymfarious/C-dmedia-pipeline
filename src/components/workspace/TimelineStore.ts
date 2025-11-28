import { create } from 'zustand';
import { triggerHaptic } from '@/lib/haptics';

export interface Clip {
  id: string;
  trackType: 'visual' | 'audio' | 'fx';
  startTime: number; // in seconds
  duration: number; // in seconds
  label: string;
  assetId?: string;
  thumbnail?: string;
}

export interface RangeSelection {
  startTime: number;
  endTime: number;
  trackId?: string; // if set, only affects this track
}

interface HistoryEntry {
  clips: Clip[];
  description: string;
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
  rangeSelection: RangeSelection | null;
  showMendingAt: number | null; // pixel position for mending animation
  
  // Undo/Redo history
  history: HistoryEntry[];
  historyIndex: number;
  
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
  
  // Range selection & cut actions
  setRangeSelection: (selection: RangeSelection | null) => void;
  cutInside: (allTracks: boolean) => void;
  cutOutside: (allTracks: boolean) => void;
  clearMendingAnimation: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushToHistory: (description: string) => void;
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
  rangeSelection: null,
  showMendingAt: null,
  history: [],
  historyIndex: -1,

  pushToHistory: (description) => {
    const { clips, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ clips: JSON.parse(JSON.stringify(clips)), description });
    // Keep only last 50 history entries
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex, clips } = get();
    if (historyIndex < 0) {
      triggerHaptic('error');
      return;
    }
    // Save current state if at end of history
    if (historyIndex === history.length - 1) {
      const newHistory = [...history];
      newHistory.push({ clips: JSON.parse(JSON.stringify(clips)), description: 'current' });
      set({ history: newHistory });
    }
    const prevState = history[historyIndex];
    set({ 
      clips: JSON.parse(JSON.stringify(prevState.clips)), 
      historyIndex: historyIndex - 1 
    });
    triggerHaptic('tap');
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 2) {
      triggerHaptic('error');
      return;
    }
    const nextState = history[historyIndex + 2];
    set({ 
      clips: JSON.parse(JSON.stringify(nextState.clips)), 
      historyIndex: historyIndex + 1 
    });
    triggerHaptic('tap');
  },

  addClip: (clip) => {
    get().pushToHistory('Add clip');
    const id = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      clips: [...state.clips, { ...clip, id }],
    }));
  },

  removeClip: (clipId) => {
    get().pushToHistory('Remove clip');
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
    triggerHaptic('tap');
    return Math.round(time / snapInterval) * snapInterval;
  },

  setRangeSelection: (selection) => {
    set({ rangeSelection: selection });
  },

  clearMendingAnimation: () => {
    set({ showMendingAt: null });
  },

  cutInside: (allTracks) => {
    const { clips, rangeSelection, zoom, pushToHistory } = get();
    if (!rangeSelection) return;

    pushToHistory('Cut inside');
    const { startTime, endTime, trackId } = rangeSelection;
    const selectionDuration = endTime - startTime;
    
    const newClips: Clip[] = [];
    
    for (const clip of clips) {
      // Skip if track-specific and doesn't match
      if (!allTracks && trackId && clip.trackType !== trackId) {
        newClips.push(clip);
        continue;
      }

      const clipEnd = clip.startTime + clip.duration;
      
      // Clip is entirely before selection - keep it
      if (clipEnd <= startTime) {
        newClips.push(clip);
      }
      // Clip is entirely within selection - delete it
      else if (clip.startTime >= startTime && clipEnd <= endTime) {
        // Don't add - it's deleted
      }
      // Clip is entirely after selection - shift it left
      else if (clip.startTime >= endTime) {
        newClips.push({
          ...clip,
          startTime: clip.startTime - selectionDuration,
        });
      }
      // Clip spans the entire selection - split into two
      else if (clip.startTime < startTime && clipEnd > endTime) {
        newClips.push({
          ...clip,
          id: `${clip.id}-left`,
          duration: startTime - clip.startTime,
        });
        newClips.push({
          ...clip,
          id: `${clip.id}-right`,
          startTime: startTime, // After mending
          duration: clipEnd - endTime,
          label: `${clip.label} (2)`,
        });
      }
      // Clip starts before and ends within - trim end
      else if (clip.startTime < startTime && clipEnd <= endTime) {
        newClips.push({
          ...clip,
          duration: startTime - clip.startTime,
        });
      }
      // Clip starts within and ends after - trim start and shift
      else if (clip.startTime >= startTime && clipEnd > endTime) {
        newClips.push({
          ...clip,
          startTime: startTime,
          duration: clipEnd - endTime,
        });
      }
    }

    // Calculate mending position
    const mendPosition = 96 + (startTime * zoom);

    set({ 
      clips: newClips, 
      rangeSelection: null,
      showMendingAt: mendPosition,
    });
    triggerHaptic('success');
  },

  cutOutside: (allTracks) => {
    const { clips, rangeSelection, pushToHistory } = get();
    if (!rangeSelection) return;

    pushToHistory('Cut outside');
    const { startTime, endTime, trackId } = rangeSelection;
    
    const newClips: Clip[] = [];
    
    for (const clip of clips) {
      // Skip if track-specific and doesn't match
      if (!allTracks && trackId && clip.trackType !== trackId) {
        // Shift all non-matching tracks to start at 0 based on selection
        newClips.push({
          ...clip,
          startTime: Math.max(0, clip.startTime - startTime),
        });
        continue;
      }

      const clipEnd = clip.startTime + clip.duration;
      
      // Clip is entirely outside selection - delete it
      if (clipEnd <= startTime || clip.startTime >= endTime) {
        continue;
      }
      
      // Clip is entirely within selection - shift to start at 0
      if (clip.startTime >= startTime && clipEnd <= endTime) {
        newClips.push({
          ...clip,
          startTime: clip.startTime - startTime,
        });
      }
      // Clip spans the entire selection - trim both ends
      else if (clip.startTime < startTime && clipEnd > endTime) {
        newClips.push({
          ...clip,
          startTime: 0,
          duration: endTime - startTime,
        });
      }
      // Clip starts before selection - trim start
      else if (clip.startTime < startTime && clipEnd <= endTime) {
        newClips.push({
          ...clip,
          startTime: 0,
          duration: clipEnd - startTime,
        });
      }
      // Clip ends after selection - trim end
      else if (clip.startTime >= startTime && clipEnd > endTime) {
        newClips.push({
          ...clip,
          startTime: clip.startTime - startTime,
          duration: endTime - clip.startTime,
        });
      }
    }

    set({ 
      clips: newClips, 
      rangeSelection: null,
    });
    triggerHaptic('success');
  },
}));
