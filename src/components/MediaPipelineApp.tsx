import { useEffect } from 'react';
import { Gallery } from './Gallery';
import { Stage } from './Stage';
import { Pipeline } from './Pipeline';
import { ErrorBoundary } from './common/ErrorBoundary';
import useAppStore from '@/store/appStore';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

export function MediaPipelineApp() {
  const { hydrate } = useAppStore();
  
  // Initialize global shortcuts
  useGlobalShortcuts();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="h-screen w-full flex bg-background">
      {/* Gallery - Left Panel */}
      <div className="w-80 flex-shrink-0">
        <ErrorBoundary>
          <Gallery />
        </ErrorBoundary>
      </div>

      {/* Stage - Center Panel */}
      <div className="flex-1 min-w-0">
        <ErrorBoundary>
          <Stage />
        </ErrorBoundary>
      </div>

      {/* Pipeline - Right Panel */}
      <div className="w-80 flex-shrink-0">
        <ErrorBoundary>
          <Pipeline />
        </ErrorBoundary>
      </div>
      
      {/* Aria-live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Pipeline status updates will be announced here
      </div>
    </div>
  );
}