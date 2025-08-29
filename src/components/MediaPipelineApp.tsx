import { useState, useEffect } from 'react';
import { Gallery } from './Gallery';
import { Stage } from './Stage';
import { Pipeline } from './Pipeline';
import { AssetCanvas } from './Canvas/AssetCanvas';
import { ErrorBoundary } from './common/ErrorBoundary';
import useAppStore from '@/store/appStore';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { Asset } from '@/types/media';

export function MediaPipelineApp() {
  const { hydrate } = useAppStore();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Initialize global shortcuts
  useGlobalShortcuts();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleOpenAssetInCanvas = (event: CustomEvent<Asset>) => {
      setSelectedAsset(event.detail);
    };

    window.addEventListener('openAssetInCanvas', handleOpenAssetInCanvas as EventListener);
    return () => {
      window.removeEventListener('openAssetInCanvas', handleOpenAssetInCanvas as EventListener);
    };
  }, []);

  const handleAssetUpdate = (updatedAsset: Asset) => {
    setSelectedAsset(updatedAsset);
  };

  const handleCloseCanvas = () => {
    setSelectedAsset(null);
  };

  return (
    <div className="h-screen w-full flex bg-background">
      {/* Gallery - Left Panel */}
      <div className="w-80 flex-shrink-0">
        <ErrorBoundary>
          <Gallery />
        </ErrorBoundary>
      </div>

      {/* Main Content */}
      {selectedAsset ? (
        <div className="flex-1 min-w-0">
          <ErrorBoundary>
            <AssetCanvas 
              asset={selectedAsset}
              onClose={handleCloseCanvas}
              onAssetUpdate={handleAssetUpdate}
            />
          </ErrorBoundary>
        </div>
      ) : (
        <>
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
        </>
      )}
      
      {/* Aria-live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Pipeline status updates will be announced here
      </div>
    </div>
  );
}