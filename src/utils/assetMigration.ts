import { Asset } from '@/types/media';
import { downloadAndUploadImage } from '@/lib/assetStorage';

/**
 * Check if an asset URL is expired or problematic
 */
export function isExpiredUrl(url: string): boolean {
  // Check for replicate.delivery URLs that might be expired
  if (url.includes('replicate.delivery')) {
    return true;
  }
  
  // Check for data URLs which should be persisted
  if (url.startsWith('data:')) {
    return true;
  }
  
  // Check for blob URLs which are temporary
  if (url.startsWith('blob:')) {
    return true;
  }
  
  return false;
}

/**
 * Check if an asset URL is accessible
 */
export async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Migrate an asset to use a persistent Supabase URL
 */
export async function migrateAsset(asset: Asset): Promise<Asset | null> {
  try {
    console.log(`🔄 Migrating asset: ${asset.name}`);
    
    // Check if URL is accessible
    const isAccessible = await isUrlAccessible(asset.src);
    if (!isAccessible) {
      console.warn(`❌ Asset URL not accessible: ${asset.src}`);
      return null;
    }
    
    // Download and re-upload to our storage
    const uploadResult = await downloadAndUploadImage(asset.src, `migrated-${asset.id}.webp`);
    
    if (uploadResult.error) {
      console.error(`❌ Failed to migrate asset: ${uploadResult.error}`);
      return null;
    }
    
    console.log(`✅ Asset migrated: ${uploadResult.url}`);
    
    return {
      ...asset,
      src: uploadResult.url,
      meta: {
        ...asset.meta,
        originalUrl: asset.src,
        migrated: true,
        migratedAt: Date.now()
      }
    };
    
  } catch (error) {
    console.error(`❌ Error migrating asset:`, error);
    return null;
  }
}

/**
 * Check if assets need migration and return migration stats
 */
export function analyzeAssets(assets: Asset[]): {
  total: number;
  needsMigration: number;
  expired: Asset[];
  healthy: Asset[];
} {
  const expired: Asset[] = [];
  const healthy: Asset[] = [];
  
  for (const asset of assets) {
    if (isExpiredUrl(asset.src)) {
      expired.push(asset);
    } else {
      healthy.push(asset);
    }
  }
  
  return {
    total: assets.length,
    needsMigration: expired.length,
    expired,
    healthy
  };
}

/**
 * Show user-friendly error message for asset issues
 */
export function getAssetErrorMessage(asset: Asset): string {
  if (asset.src.includes('replicate.delivery')) {
    return `This image URL has expired. Replicate.delivery URLs are temporary and cannot be edited after some time. Please regenerate the image.`;
  }
  
  if (asset.src.startsWith('data:')) {
    return `This image is stored as inline data. For better performance and editing, it should be uploaded to storage.`;
  }
  
  if (asset.src.startsWith('blob:')) {
    return `This image is stored temporarily. It needs to be saved to permanent storage before editing.`;
  }
  
  return `This image URL is not accessible. Please check the image source or regenerate it.`;
}