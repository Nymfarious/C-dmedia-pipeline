import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const objectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.object-remove",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const instruction = params.removeObjectInstruction || params.instruction || "Remove the marked objects cleanly";
    
    // Use Nano Banana as primary with smart instruction generation
    let modelInput;
    
    if (params.brushMask && params.brushMask.length > 0) {
      // Enhanced instruction with brush context
      const enhancedInstruction = `${instruction}. Remove the objects marked by ${params.brushMask.length} brush strokes`;
      modelInput = {
        model: "google/nano-banana",
        operation: 'nano-banana-edit',
        input: {
          image: asset.src,
          instruction: enhancedInstruction,
          negative_prompt: "blurred, distorted, artifacts, incomplete removal",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.8
        }
      };
    } else {
      // Pure text-based removal
      modelInput = {
        model: "google/nano-banana", 
        operation: 'nano-banana-edit',
        input: {
          image: asset.src,
          instruction,
          negative_prompt: "blurred, distorted, artifacts",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.7
        }
      };
    }

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: modelInput
    });

    if (error) {
      console.error('Nano Banana removal failed, trying fallback:', error);
      
      // Fallback to andreasjansson/remove-object if Nano Banana fails
      const fallbackInput = {
        model: "andreasjansson/remove-object",
        operation: 'object-removal',
        input: {
          image: asset.src,
          prompt: instruction,
          negative_prompt: "blurred, distorted, artifacts"
        }
      };
      
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('replicate', {
        body: fallbackInput
      });
      
      if (fallbackError || !fallbackData?.output) {
        throw new Error(`Object removal failed: ${fallbackError?.message || 'No output received'}`);
      }
      
      // Create asset from fallback
      return {
        id: crypto.randomUUID(),
        type: asset.type,
        name: `${asset.name} (Objects Removed)`,
        src: Array.isArray(fallbackData.output) ? fallbackData.output[0] : fallbackData.output,
        meta: {
          ...asset.meta,
          provider: 'replicate.object-remove-fallback',
          originalAsset: asset.id,
          editType: 'object-removal',
          instruction
        },
        createdAt: Date.now(),
        derivedFrom: asset.id,
        category: 'edited',
        subcategory: 'Enhanced'
      };
    }

    if (!data?.output) {
      throw new Error('No output received from object removal');
    }

    // Create new asset from primary result
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Objects Removed)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.nano-banana',
        originalAsset: asset.id,
        editType: 'object-removal',
        instruction
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Enhanced'
    };

    return newAsset;
  }
};