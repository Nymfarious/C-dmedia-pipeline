import { create } from 'zustand';

interface DevToolsStore {
  isOpen: boolean;
  activeSection: string;
  toggleDrawer: () => void;
  setActiveSection: (section: string) => void;
  closeDrawer: () => void;
}

export const useDevToolsStore = create<DevToolsStore>((set) => ({
  isOpen: false,
  activeSection: 'overview',
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  closeDrawer: () => set({ isOpen: false }),
}));
