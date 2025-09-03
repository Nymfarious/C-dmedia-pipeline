import { useEffect, useRef } from 'react';
import useAppStore from '@/store/appStore';

// Singleton to prevent multiple initializations across app components
const didInit = { current: false };

export function useAppBootstrap() {
  const init = useAppStore(s => s.initialize);
  
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    
    console.log('App initializing store...');
    init().then(() => {
      console.log('Store initialized successfully');
    }).catch((error) => {
      console.error('Failed to initialize store:', error);
    });
  }, [init]);
  
  return useAppStore(s => s.isHydrating);
}