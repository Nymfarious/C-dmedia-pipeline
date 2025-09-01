import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageGenStudioCanvas } from './ImageGenStudioCanvas';
import { AssetMigrationToast } from '../AssetMigrationToast';
import useAppStore from '@/store/appStore';

export function ImageGenStudioPageWrapper() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeStore() {
      try {
        const { hydrate, migrateExpiredAssets } = useAppStore.getState();
        await hydrate();
        await migrateExpiredAssets();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize store:', error);
        setIsInitialized(true);
      }
    }
    
    initializeStore();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ImageGen Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageGenStudioCanvas />
      <AssetMigrationToast />
    </>
  );
}