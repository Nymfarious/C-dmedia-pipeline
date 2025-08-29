import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an asset (image or mask) to Supabase Storage
 */
export async function uploadAsset(
  file: Blob | File, 
  type: 'image' | 'mask' = 'image',
  fileName?: string
): Promise<UploadResult> {
  try {
    const bucket = type === 'mask' ? 'ai-masks' : 'ai-images';
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    // Generate filename
    const timestamp = Date.now();
    const extension = file.type.includes('png') ? 'png' : 
                     file.type.includes('jpeg') ? 'jpg' : 'webp';
    
    const path = type === 'mask' && userId 
      ? `${userId}/${fileName || `mask-${timestamp}.${extension}`}`
      : fileName || `${type}-${timestamp}.${extension}`;

    console.log(`Uploading ${type} to bucket: ${bucket}, path: ${path}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log(`Upload successful: ${publicUrl}`);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Convert a data URL to a Blob for uploading
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload a mask from data URL
 */
export async function uploadMaskFromDataUrl(
  maskDataUrl: string,
  fileName?: string
): Promise<UploadResult> {
  const blob = dataUrlToBlob(maskDataUrl);
  return uploadAsset(blob, 'mask', fileName);
}

/**
 * Download and upload an external image URL to our storage
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return uploadAsset(blob, 'image', fileName);
  } catch (error) {
    console.error('Download and upload error:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Download failed' 
    };
  }
}

/**
 * Clean up temporary storage files
 */
export async function cleanupAsset(path: string, bucket: 'ai-images' | 'ai-masks' = 'ai-images') {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Cleanup error:', error);
    } else {
      console.log(`Cleaned up asset: ${path}`);
    }
  } catch (error) {
    console.error('Cleanup exception:', error);
  }
}