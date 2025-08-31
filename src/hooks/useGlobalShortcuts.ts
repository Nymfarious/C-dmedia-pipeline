import { useEffect } from 'react';
import useAppStore from '@/store/appStore';

export function useGlobalShortcuts() {
  // Safe store access with error handling
  const activeTool = useAppStore((state) => state.activeTool);
  const exitActiveTool = useAppStore((state) => state.exitActiveTool);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to exit any active tool
      if (e.key === 'Escape') {
        if (activeTool !== 'select') {
          console.log('⌨️ ESC pressed - exiting tool:', activeTool);
          exitActiveTool();
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTool, exitActiveTool]);
}