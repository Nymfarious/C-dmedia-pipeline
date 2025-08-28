import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const objectAdderAdapter: ImageEditAdapter = {
  key: "replicate.object-add",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const instruction = params.addObjectInstruction || params.instruction || "Add object to the image";
    
    // Enhanced instruction with position context
    let enhancedInstruction = instruction;
    if (params.clickPosition) {
      enhancedInstruction = `${instruction} at position x:${Math.round(params.clickPosition.x)}, y:${Math.round(params.clickPosition.y)}`;
    }

    // Use FLUX.1 inpainting for object addition
    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "black-forest-labs/flux.1-dev",
        operation: 'add-object',
        input: {
          image: asset.src,
          prompt: enhancedInstruction,
          negative_prompt: "blurred, distorted, artifacts, unnatural placement, bad composition",
          guidance_scale: 3.5,
          num_inference_steps: 28,
          strength: 0.6,
          num_outputs: 1
        }
      }
    });

    if (error) {
      console.error('FLUX inpainting failed, trying Nano Banana:', error);
      
      // Fallback to Nano Banana for object addition
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('replicate', {
        body: {
          model: "google/nano-banana",
          operation: 'nano-banana-edit',
          input: {
            image: asset.src,
            instruction: enhancedInstruction,
            negative_prompt: "blurred, distorted, artifacts, unnatural placement",
            guidance_scale: 7.5,
            num_inference_steps: 20,
            strength: 0.6
          }
        }
      });
      
      if (fallbackError || !fallbackData?.output) {
        throw new Error(`Object addition failed: ${fallbackError?.message || 'No output received'}`);
      }
      
      // Create asset from fallback
      return {
        id: crypto.randomUUID(),
        type: asset.type,
        name: `${asset.name} (Object Added)`,
        src: Array.isArray(fallbackData.output) ? fallbackData.output[0] : fallbackData.output,
        meta: {
          ...asset.meta,
          provider: 'replicate.nano-banana',
          originalAsset: asset.id,
          editType: 'object-addition',
          instruction: enhancedInstruction
        },
        createdAt: Date.now(),
        derivedFrom: asset.id,
        category: 'edited',
        subcategory: 'Enhanced'
      };
    }

    if (!data?.output) {
      throw new Error('No output received from object addition');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Object Added)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.flux-inpaint',
        originalAsset: asset.id,
        editType: 'object-addition',
        instruction: enhancedInstruction
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Enhanced'
    };

    return newAsset;
  }
};