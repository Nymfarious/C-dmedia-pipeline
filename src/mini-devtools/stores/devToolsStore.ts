import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DevToolsStore {
  isOpen: boolean;
  activeSection: string;
  theme: 'light' | 'dark' | 'system';
  toggleDrawer: () => void;
  setActiveSection: (section: string) => void;
  closeDrawer: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useDevToolsStore = create<DevToolsStore>()(
  persist(
    (set) => ({
      isOpen: false,
      activeSection: 'overview',
      theme: 'system',
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      setActiveSection: (section) => set({ activeSection: section }),
      closeDrawer: () => set({ isOpen: false }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'devtools-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
