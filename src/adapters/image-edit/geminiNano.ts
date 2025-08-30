import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const geminiNanoAdapter: ImageEditAdapter = {
  key: "replicate.nano-banana",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    console.log('Nano Banana edit params:', params);
    
    let instruction = params.instruction || "Edit this image";
    let operation = params.operation || 'nano-banana-edit';
    
    // Enhanced instruction generation based on edit type
    if (params.brushMask && params.brushMask.length > 0) {
      instruction = `Remove the objects marked by ${params.brushMask.length} brush strokes. ${instruction}`;
    }
    
    // Handle mask-based operations
    if (params.maskPngDataUrl && params.operation) {
      switch (params.operation) {
        case 'remove-object':
        case 'advanced-object-removal':
          operation = 'advanced-object-removal';
          instruction = params.removeObjectInstruction || `Remove the objects in the masked area. ${instruction}`;
          break;
        case 'add-object':
          operation = 'add-object';
          instruction = params.addObjectInstruction || `Add ${instruction} in the masked area`;
          break;
        case 'flux-inpaint':
          operation = 'flux-inpaint';
          break;
        case 'multi-image-fusion':
          operation = 'nano-banana-edit';
          instruction = `Combine and blend these images: ${instruction}`;
          break;
      }
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

    // Prepare input for enhanced replicate function
    const input: any = {
      image: asset.src,
      prompt: instruction, // nano-banana uses 'prompt' not 'instruction'
      negative_prompt: "blurred, distorted, artifacts, low quality",
      guidance_scale: params.guidance_scale || 7.5,
      num_inference_steps: params.num_inference_steps || 20,
      strength: params.strength || 0.8
    };

    // Add mask if provided
    if (params.maskPngDataUrl) {
      input.mask = params.maskPngDataUrl;
    }

    // Add multi-image support
    if (params.multiImageUrls && params.multiImageUrls.length > 1) {
      input.images = params.multiImageUrls;
      input.composition_style = params.compositionStyle || 'seamless blend';
    }

    console.log('Calling replicate-enhanced with:', { operation, input });

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation,
        input
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
      name: `${asset.name} (${operation === 'multi-image-fusion' ? 'Combined' : 'Edited'} by Nano Banana)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.nano-banana',
        model: 'google/nano-banana',
        originalAsset: asset.id,
        editType: operation,
        instruction,
        editedAt: Date.now()
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: params.operation === 'multi-image-fusion' ? 'AI Combined' : 'AI Enhanced'
    };

    return newAsset;
  }
};