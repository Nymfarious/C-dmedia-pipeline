import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioStore {
  masterMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  narrationVolume: number;
  setMasterMuted: (muted: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setNarrationVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      masterMuted: false,
      musicVolume: 70,
      sfxVolume: 80,
      narrationVolume: 100,
      setMasterMuted: (muted) => set({ masterMuted: muted }),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),
      setNarrationVolume: (volume) => set({ narrationVolume: volume }),
    }),
    {
      name: 'audio-settings',
    }
  )
);
