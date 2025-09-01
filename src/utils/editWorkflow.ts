/**
 * Robust fallback workflow: Nano-Banana first, FLUX as backup
 */

import { Asset, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { validateAssetForEditing } from './assetValidation';
import { migrateAsset } from './assetMigration';

export interface EditResult {
  ok: boolean;
  image?: string;
  error?: string;
  changed?: boolean;
}

/**
 * Check if an edit actually changed the image using perceptual diff
 */
export async function detectImageChange(
  originalUrl: string, 
  editedUrl: string, 
  threshold: number = 0.1
): Promise<boolean> {
  try {
    console.log('🔍 Checking if image actually changed...');
    
    // Load both images
    const [original, edited] = await Promise.all([
      loadImageFromUrl(originalUrl),
      loadImageFromUrl(editedUrl)
    ]);
    
    // Create canvases for comparison
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const size = 256; // Downscale for faster comparison
    
    canvas1.width = canvas1.height = size;
    canvas2.width = canvas2.height = size;
    
    const ctx1 = canvas1.getContext('2d')!;
    const ctx2 = canvas2.getContext('2d')!;
    
    // Draw images at same size
    ctx1.drawImage(original, 0, 0, size, size);
    ctx2.drawImage(edited, 0, 0, size, size);
    
    // Get image data
    const data1 = ctx1.getImageData(0, 0, size, size).data;
    const data2 = ctx2.getImageData(0, 0, size, size).data;
    
    // Calculate difference
    let totalDiff = 0;
    for (let i = 0; i < data1.length; i += 4) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      totalDiff += (rDiff + gDiff + bDiff) / 3;
    }
    
    const avgDiff = totalDiff / (data1.length / 4);
    const normalizedDiff = avgDiff / 255;
    
    console.log(`📊 Image difference: ${(normalizedDiff * 100).toFixed(2)}% (threshold: ${(threshold * 100).toFixed(1)}%)`);
    
    return normalizedDiff > threshold;
    
  } catch (error) {
    console.error('❌ Error detecting image change:', error);
    // Assume change if we can't detect
    return true;
  }
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Run edit operation with specified model
 */
export async function runEdit(
  asset: Asset,
  params: ImageEditParams
): Promise<EditResult> {
  try {
    console.log(`🎯 Running edit with ${params.provider}:`, params.operation);
    
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: params.operation,
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl,
          prompt: params.instruction,
          negative_prompt: params.negative_prompt,
          guidance_scale: params.guidance_scale,
          num_inference_steps: params.num_inference_steps,
          strength: params.strength
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.output) {
      throw new Error('No output received from edit operation');
    }

    return {
      ok: true,
      // Use the persisted Supabase URL from edge function
      image: data.output,
      changed: true // We'll validate this separately if needed
    };
    
  } catch (error) {
    console.error(`❌ Edit failed with ${params.provider}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Robust edit workflow: Asset validation, migration, then editing with fallback
 */
export async function runEditWithFallback(
  asset: Asset,
  params: ImageEditParams,
  onProgress?: (status: string) => void
): Promise<EditResult & { migratedAsset?: Asset }> {
  console.log('🚀 Starting robust edit workflow...');
  
  // Step 1: Validate asset
  onProgress?.('Validating asset...');
  const validation = await validateAssetForEditing(asset);
  
  let workingAsset = asset;
  
  if (!validation.valid && validation.needsMigration) {
    onProgress?.('Asset needs migration, attempting to migrate...');
    console.log('🔄 Asset needs migration, attempting to migrate...');
    
    const migratedAsset = await migrateAsset(asset);
    if (!migratedAsset) {
      return {
        ok: false,
        error: `Asset migration failed: ${validation.error}`,
        migratedAsset: undefined
      };
    }
    
    workingAsset = migratedAsset;
    console.log('✅ Asset migration successful');
  } else if (!validation.valid) {
    return {
      ok: false,
      error: validation.error || 'Asset validation failed',
      migratedAsset: undefined
    };
  }
  
  // Step 2: Try primary model
  onProgress?.('Trying primary model...');
  const primaryResult = await runEdit(workingAsset, params);
  
  if (primaryResult.ok && primaryResult.image) {
    // Check if the edit actually changed anything
    const hasChanged = await detectImageChange(workingAsset.src, primaryResult.image);
    
    if (hasChanged) {
      console.log('✅ Primary model succeeded');
      onProgress?.('Edit completed successfully');
      return {
        ...primaryResult,
        changed: true,
        migratedAsset: workingAsset !== asset ? workingAsset : undefined
      };
    } else {
      console.log('⚠️ Primary model returned unchanged image, trying fallback...');
      onProgress?.('Primary model returned no changes, trying fallback...');
    }
  } else {
    console.log('❌ Primary model failed, trying fallback...', primaryResult.error);
    onProgress?.('Primary model failed, trying fallback...');
  }
  
  // Step 3: Fallback to FLUX inpaint with same parameters
  const fallbackParams: ImageEditParams = {
    ...params,
    operation: 'flux-inpaint',
    provider: 'replicate.flux-inpaint'
  };
  
  const fallbackResult = await runEdit(workingAsset, fallbackParams);
  
  if (fallbackResult.ok) {
    console.log('✅ Fallback model succeeded');
    onProgress?.('Fallback completed successfully');
    return {
      ...fallbackResult,
      changed: true,
      migratedAsset: workingAsset !== asset ? workingAsset : undefined
    };
  } else {
    console.log('❌ Both models failed');
    onProgress?.('Both models failed');
    return {
      ok: false,
      error: `Both primary (${params.provider}) and fallback (FLUX) failed. Primary: ${primaryResult.error}, Fallback: ${fallbackResult.error}`,
      migratedAsset: workingAsset !== asset ? workingAsset : undefined
    };
  }
}