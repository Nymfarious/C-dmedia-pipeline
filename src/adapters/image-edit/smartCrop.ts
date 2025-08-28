import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const smartCropAdapter: ImageEditAdapter = {
  key: "replicate.smart-crop",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.cropSettings) {
      throw new Error('Crop settings required for smart cropping');
    }

    const { cropSettings } = params;
    const instruction = `Smart crop this image for ${cropSettings.aspectRatio} aspect ratio with ${cropSettings.preset} composition. Maintain the main subject and use AI to extend or recompose the background as needed for the new dimensions.`;

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "stability-ai/stable-diffusion-x4-upscaler:b6af9eb9c15fc3a5c4b88bfb97e96b125f2b1e87d00e97e6cfb7ad79cfe0b86c",
        operation: 'smart-crop',
        input: {
          image: asset.src,
          prompt: instruction,
          crop_x: cropSettings.x,
          crop_y: cropSettings.y,
          crop_width: cropSettings.width,
          crop_height: cropSettings.height,
          aspect_ratio: cropSettings.aspectRatio,
          composition_preset: cropSettings.preset
        }
      }
    });

    if (error) {
      throw new Error(`Smart crop failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from smart crop');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Smart Cropped)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.smart-crop',
        originalAsset: asset.id,
        editType: 'smart-crop',
        cropSettings: cropSettings
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Cropped'
    };

    return newAsset;
  }
};