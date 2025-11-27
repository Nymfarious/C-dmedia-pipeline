import { createContext, useContext, ReactNode } from 'react';
import { MiniDevConfig } from './types';

interface MiniDevContextValue {
  config: MiniDevConfig;
}

const MiniDevContext = createContext<MiniDevContextValue | null>(null);

interface MiniDevProviderProps {
  config: MiniDevConfig;
  children: ReactNode;
}

export function MiniDevProvider({ config, children }: MiniDevProviderProps) {
  return (
    <MiniDevContext.Provider value={{ config }}>
      {children}
    </MiniDevContext.Provider>
  );
}

export function useMiniDevContext() {
  const context = useContext(MiniDevContext);
  if (!context) {
    throw new Error('useMiniDevContext must be used within MiniDevProvider');
  }
  return context;
}
