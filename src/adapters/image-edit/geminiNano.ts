import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const geminiNanoAdapter: ImageEditAdapter = {
  key: "replicate.nano-banana",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    let instruction = params.instruction || "Edit this image";
    
    // Enhanced instruction generation based on edit type
    if (params.brushMask && params.brushMask.length > 0) {
      instruction = `Remove the objects marked by ${params.brushMask.length} brush strokes. ${instruction}`;
    }
    
    if (params.colorAdjustments) {
      const adjustments = [];
      if (params.colorAdjustments.brightness !== undefined && params.colorAdjustments.brightness !== 0) {
        adjustments.push(`adjust brightness by ${params.colorAdjustments.brightness > 0 ? '+' : ''}${params.colorAdjustments.brightness}%`);
      }
      if (params.colorAdjustments.contrast !== undefined && params.colorAdjustments.contrast !== 0) {
        adjustments.push(`adjust contrast by ${params.colorAdjustments.contrast > 0 ? '+' : ''}${params.colorAdjustments.contrast}%`);
      }
      if (params.colorAdjustments.saturation !== undefined && params.colorAdjustments.saturation !== 0) {
        adjustments.push(`adjust saturation by ${params.colorAdjustments.saturation > 0 ? '+' : ''}${params.colorAdjustments.saturation}%`);
      }
      if (params.colorAdjustments.warmth !== undefined && params.colorAdjustments.warmth !== 0) {
        adjustments.push(`adjust warmth by ${params.colorAdjustments.warmth > 0 ? '+' : ''}${params.colorAdjustments.warmth}%`);
      }
      if (adjustments.length > 0) {
        instruction = adjustments.join(', ') + '. ' + instruction;
      }
    }
    
    if (params.stylePreset) {
      instruction = `Apply ${params.stylePreset} style filter. ${instruction}`;
    }
    
    if (params.cropSettings) {
      instruction = `Crop and recompose the image for ${params.cropSettings.aspectRatio} aspect ratio with ${params.cropSettings.preset} composition. ${instruction}`;
    }
    
    if (params.poseAdjustments) {
      instruction = `Adjust the pose according to the keypoint modifications. ${instruction}`;
    }

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "google/nano-banana",
        operation: 'nano-banana-edit',
        input: {
          image: asset.src,
          instruction,
          negative_prompt: "blurred, distorted, artifacts, low quality",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.8
        }
      }
    });

    if (error) {
      console.error('Nano Banana editing error:', error);
      throw new Error(`Nano Banana editing failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No edited image received from Nano Banana');
    }

    // Create new asset with edited image
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Edited by Nano Banana)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.nano-banana',
        model: 'google/nano-banana',
        originalAsset: asset.id,
        editType: 'nano-banana-edit',
        instruction,
        editedAt: Date.now()
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'AI Enhanced'
    };

    return newAsset;
  }
};