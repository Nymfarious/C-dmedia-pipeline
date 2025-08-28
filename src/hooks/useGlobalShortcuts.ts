import { useEffect, useCallback } from 'react';
import useAppStore from '@/store/appStore';

export function useGlobalShortcuts() {
  const { 
    selectedAssetIds,
    currentStepKind,
    currentProviderKey,
    params,
    assets,
    setSelected,
    enqueueStep,
    runStep
  } = useAppStore();

  const handleRunStep = useCallback(async () => {
    const canRun = currentStepKind === 'GENERATE' || selectedAssetIds.length > 0;
    if (!canRun) return;
    
    try {
      const stepId = enqueueStep(currentStepKind, selectedAssetIds, params, currentProviderKey);
      await runStep(stepId);
    } catch (error) {
      console.error('Failed to run step:', error);
    }
  }, [currentStepKind, selectedAssetIds, params, currentProviderKey, enqueueStep, runStep]);

  const handleSelectAll = useCallback(() => {
    const allAssetIds = Object.keys(assets);
    setSelected(allAssetIds);
  }, [assets, setSelected]);

  const handleClearSelection = useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleRunStep();
        }
        break;
      
      case 'g':
        event.preventDefault();
        // Focus gallery search input
        const searchInput = document.querySelector('[placeholder="Search assets..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        break;
      
      case 'a':
        // Check if gallery is focused (simple heuristic)
        const galleryElement = document.querySelector('[data-gallery]');
        if (galleryElement && galleryElement.contains(event.target as Node)) {
          event.preventDefault();
          handleSelectAll();
        }
        break;
      
      case 'escape':
        event.preventDefault();
        handleClearSelection();
        // Close any open popovers/dialogs
        const openPopovers = document.querySelectorAll('[data-state="open"]');
        openPopovers.forEach(popover => {
          const closeButton = popover.querySelector('[data-radix-collection-item]');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });
        break;
    }
  }, [handleRunStep, handleSelectAll, handleClearSelection]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}