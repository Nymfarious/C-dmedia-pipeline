import { Asset } from '@/types/media';
import { downloadAndUploadImage } from '@/lib/assetStorage';

/**
 * Check if an asset URL is expired or problematic
 */
export function isExpiredUrl(url: string): boolean {
  // Skip demo assets from migration
  if (url.includes('Demo ') || url.includes('demo-')) {
    return false;
  }
  
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
 * Migration state tracking to prevent retry loops
 */
const migrationAttempts = new Map<string, { count: number; lastAttempt: number; failed: boolean; loggedCooldown?: boolean }>();

/**
 * Check if an asset should be migrated (not already failed or in cooldown)
 */
function shouldMigrateAsset(asset: Asset): boolean {
  const assetId = asset.id;
  const attempts = migrationAttempts.get(assetId);
  
  // Skip if marked as failed
  if (attempts?.failed) {
    return false;
  }
  
  // Skip if in cooldown period (exponential backoff - longer delays)
  if (attempts && attempts.count > 0) {
    const cooldownTime = Math.min(5000 * Math.pow(3, attempts.count), 300000); // Max 5 minutes
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < cooldownTime) {
      // Only log once per cooldown period to reduce spam
      if (!attempts.loggedCooldown) {
        console.log(`⏭️ Asset ${assetId} in cooldown for ${Math.round(cooldownTime/1000)}s`);
        migrationAttempts.set(assetId, { ...attempts, loggedCooldown: true });
      }
      return false;
    }
  }
  
  // Skip if too many attempts
  if (attempts && attempts.count >= 3) {
    migrationAttempts.set(asset.id, { ...attempts, failed: true });
    return false;
  }
  
  return true;
}

/**
 * Record a migration attempt
 */
function recordMigrationAttempt(assetId: string, success: boolean) {
  const attempts = migrationAttempts.get(assetId) || { count: 0, lastAttempt: 0, failed: false };
  
  if (success) {
    migrationAttempts.delete(assetId); // Clear on success
  } else {
    migrationAttempts.set(assetId, {
      count: attempts.count + 1,
      lastAttempt: Date.now(),
      failed: false
    });
  }
}

/**
 * Migrate an asset to use a persistent Supabase URL
 */
export async function migrateAsset(asset: Asset): Promise<Asset | null> {
  try {
    // Skip demo assets completely
    if (asset.name.includes('Demo ') || asset.src.includes('demo-')) {
      console.log(`⏭️ Skipping demo asset: ${asset.name}`);
      return null;
    }
    
    // Check if migration should be attempted
    if (!shouldMigrateAsset(asset)) {
      return null;
    }
    
    console.log(`🔄 Migrating asset: ${asset.name}`);
    
    // Skip if already migrated to Supabase
    if (asset.src.includes('supabase.co')) {
      console.log(`⏭️ Asset already migrated: ${asset.name}`);
      recordMigrationAttempt(asset.id, true);
      return asset;
    }
    
    // Check if URL is accessible
    const isAccessible = await isUrlAccessible(asset.src);
    if (!isAccessible) {
      console.log(`❌ Asset URL not accessible: ${asset.name}`);
      recordMigrationAttempt(asset.id, false);
      return null;
    }
    
    // Generate a better filename with proper extension
    const extension = asset.src.includes('.png') ? 'png' : 
                     asset.src.includes('.jpg') || asset.src.includes('.jpeg') ? 'jpg' : 'webp';
    const fileName = `migrated-${asset.id}.${extension}`;
    
    // Download and re-upload to our storage
    const uploadResult = await downloadAndUploadImage(asset.src, fileName);
    
    if (uploadResult.error) {
      console.error(`❌ Failed to migrate asset: ${uploadResult.error}`);
      recordMigrationAttempt(asset.id, false);
      return null;
    }
    
    console.log(`✅ Asset migrated: ${uploadResult.url}`);
    recordMigrationAttempt(asset.id, true);
    
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
    recordMigrationAttempt(asset.id, false);
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
    // Skip demo assets from migration analysis
    if (asset.name.includes('Demo ') || asset.src.includes('demo-')) {
      healthy.push(asset);
      continue;
    }
    
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