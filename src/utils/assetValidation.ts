import { Asset } from '@/types/media';
import { isExpiredUrl, isUrlAccessible } from './assetMigration';

/**
 * Validate asset before sending to edge function
 */
export async function validateAssetForEditing(asset: Asset): Promise<{
  valid: boolean;
  error?: string;
  needsMigration?: boolean;
}> {
  // Check if URL is expired
  if (isExpiredUrl(asset.src)) {
    return {
      valid: false,
      error: 'Asset URL has expired and needs migration',
      needsMigration: true
    };
  }
  
  // Check if URL is accessible
  const isAccessible = await isUrlAccessible(asset.src);
  if (!isAccessible) {
    return {
      valid: false,
      error: 'Asset URL is not accessible',
      needsMigration: true
    };
  }
  
  return { valid: true };
}

/**
 * Quick validation without network requests
 */
export function quickValidateAsset(asset: Asset): {
  valid: boolean;
  error?: string;
  needsMigration?: boolean;
} {
  if (isExpiredUrl(asset.src)) {
    return {
      valid: false,
      error: 'Asset URL has expired and needs migration',
      needsMigration: true
    };
  }
  
  return { valid: true };
}