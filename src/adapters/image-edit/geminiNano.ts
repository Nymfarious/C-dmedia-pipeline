import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const geminiNanoAdapter: ImageEditAdapter = {
  key: "gemini.nano",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    let instruction = params.instruction || "Edit this image";
    
    // Enhanced instruction generation based on edit type
    if (params.brushMask && params.brushMask.length > 0) {
      instruction = `Remove the objects marked by ${params.brushMask.length} brush strokes. ${instruction}`;
    }
    
    if (params.colorAdjustments) {
      const adjustments = [];
      if (params.colorAdjustments.brightness !== 0) {
        adjustments.push(`adjust brightness by ${params.colorAdjustments.brightness > 0 ? '+' : ''}${params.colorAdjustments.brightness}%`);
      }
      if (params.colorAdjustments.contrast !== 0) {
        adjustments.push(`adjust contrast by ${params.colorAdjustments.contrast > 0 ? '+' : ''}${params.colorAdjustments.contrast}%`);
      }
      if (params.colorAdjustments.saturation !== 0) {
        adjustments.push(`adjust saturation by ${params.colorAdjustments.saturation > 0 ? '+' : ''}${params.colorAdjustments.saturation}%`);
      }
      if (params.colorAdjustments.warmth !== 0) {
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

    const { data, error } = await supabase.functions.invoke('gemini-edit', {
      body: {
        imageUrl: asset.src,
        instruction,
        model: 'gemini-2.5-flash-image'
      }
    });

    if (error) {
      console.error('Gemini Nano editing error:', error);
      throw new Error(`Gemini Nano editing failed: ${error.message}`);
    }

    if (!data?.asset) {
      throw new Error('No edited image received from Gemini Nano');
    }

    // Create new asset with edited image
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Edited by Gemini Nano)`,
      src: data.asset.src,
      meta: {
        ...asset.meta,
        provider: 'gemini.nano',
        model: 'gemini-2.5-flash-image',
        originalAsset: asset.id,
        editType: 'gemini-nano-edit',
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