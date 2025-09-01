/**
 * Gallery utility functions for bulk operations
 */

import { Asset } from '@/types/media';

export interface BulkDeleteOptions {
  selectedIds: string[];
  filteredIds: string[];
  showUndo?: boolean;
  undoTimeoutMs?: number;
}

export interface BulkDeleteResult {
  deletedCount: number;
  undo?: () => void;
}

/**
 * Bulk delete with undo functionality
 */
export function createBulkDeleteHandler(
  assets: Asset[],
  onDelete: (ids: string[]) => void,
  onRestore?: (assets: Asset[]) => void
) {
  let deletedAssets: Asset[] = [];
  let undoTimeout: NodeJS.Timeout | null = null;

  const deleteAssets = (ids: string[], options: { showUndo?: boolean; undoTimeoutMs?: number } = {}) => {
    const { showUndo = true, undoTimeoutMs = 6000 } = options;
    
    // Store deleted assets for potential undo
    deletedAssets = assets.filter(asset => ids.includes(asset.id));
    
    // Perform soft delete (remove from UI)
    onDelete(ids);
    
    if (showUndo && onRestore) {
      // Set up undo timeout
      if (undoTimeout) clearTimeout(undoTimeout);
      
      undoTimeout = setTimeout(() => {
        // Permanent deletion after timeout
        deletedAssets = [];
        undoTimeout = null;
      }, undoTimeoutMs);
      
      return {
        deletedCount: ids.length,
        undo: () => {
          if (undoTimeout) {
            clearTimeout(undoTimeout);
            undoTimeout = null;
          }
          onRestore(deletedAssets);
          deletedAssets = [];
        }
      };
    }
    
    return {
      deletedCount: ids.length
    };
  };

  const deleteSelected = (selectedIds: string[], options?: { showUndo?: boolean; undoTimeoutMs?: number }) => {
    return deleteAssets(selectedIds, options);
  };

  const deleteAllFiltered = (filteredIds: string[], options?: { showUndo?: boolean; undoTimeoutMs?: number }) => {
    return deleteAssets(filteredIds, options);
  };

  return {
    deleteSelected,
    deleteAllFiltered,
    cancelUndo: () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
        deletedAssets = [];
      }
    }
  };
}