import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type FerryState = 'idle' | 'departing-to-editor' | 'arriving-at-editor' | 'departing-to-canvas' | 'arriving-at-canvas';
type FerryDestination = 'canvas' | 'editor';

interface ModeFerryContextType {
  ferryState: FerryState;
  currentMode: FerryDestination;
  startFerry: (destination: FerryDestination) => void;
  completeFerry: () => void;
  isAnimating: boolean;
}

const ModeFerryContext = createContext<ModeFerryContextType | undefined>(undefined);

export function ModeFerryProvider({ children }: { children: ReactNode }) {
  const [ferryState, setFerryState] = useState<FerryState>('idle');
  const [currentMode, setCurrentMode] = useState<FerryDestination>('canvas');

  const startFerry = useCallback((destination: FerryDestination) => {
    if (destination === 'editor') {
      setFerryState('departing-to-editor');
    } else {
      setFerryState('departing-to-canvas');
    }
  }, []);

  const completeFerry = useCallback(() => {
    if (ferryState === 'departing-to-editor') {
      setCurrentMode('editor');
      setFerryState('arriving-at-editor');
      // Reset to idle after arrival animation
      setTimeout(() => setFerryState('idle'), 500);
    } else if (ferryState === 'departing-to-canvas') {
      setCurrentMode('canvas');
      setFerryState('arriving-at-canvas');
      setTimeout(() => setFerryState('idle'), 500);
    }
  }, [ferryState]);

  const isAnimating = ferryState !== 'idle';

  return (
    <ModeFerryContext.Provider value={{ ferryState, currentMode, startFerry, completeFerry, isAnimating }}>
      {children}
    </ModeFerryContext.Provider>
  );
}

export function useModeFerry() {
  const context = useContext(ModeFerryContext);
  if (!context) {
    throw new Error('useModeFerry must be used within ModeFerryProvider');
  }
  return context;
}
