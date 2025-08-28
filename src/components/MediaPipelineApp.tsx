import { useEffect } from 'react';
import { Gallery } from './Gallery';
import { Stage } from './Stage';
import { Pipeline } from './Pipeline';
import useAppStore from '@/store/appStore';

export function MediaPipelineApp() {
  const { hydrate } = useAppStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="h-screen w-full flex bg-background">
      {/* Gallery - Left Panel */}
      <div className="w-80 flex-shrink-0">
        <Gallery />
      </div>

      {/* Stage - Center Panel */}
      <div className="flex-1 min-w-0">
        <Stage />
      </div>

      {/* Pipeline - Right Panel */}
      <div className="w-80 flex-shrink-0">
        <Pipeline />
      </div>
    </div>
  );
}