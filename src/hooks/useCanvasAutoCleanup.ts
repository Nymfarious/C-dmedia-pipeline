import { useEffect } from 'react';
import useAppStore from '@/store/appStore';

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const EMPTY_CANVAS_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function useCanvasAutoCleanup() {
  const { canvases, deleteCanvas } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const emptyCanvasesToDelete = canvases.filter(canvas => {
        // Delete empty canvases older than 10 minutes
        return !canvas.asset && (now - canvas.createdAt) > EMPTY_CANVAS_TIMEOUT;
      });

      if (emptyCanvasesToDelete.length > 0) {
        console.log(`Auto-cleaning ${emptyCanvasesToDelete.length} empty canvases`);
        emptyCanvasesToDelete.forEach(canvas => deleteCanvas(canvas.id));
      }
    }, CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, [canvases, deleteCanvas]);
}