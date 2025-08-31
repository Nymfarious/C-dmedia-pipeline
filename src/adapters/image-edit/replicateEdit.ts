import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const replicateEdit: ImageEditAdapter = {
  key: "replicate.edit",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl) {
      throw new Error('Mask is required for inpainting. Please create a mask by painting the area to edit.');
    }

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'flux-inpaint',
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl,
          prompt: params.instruction || 'Edit the masked area',
          guidance_scale: params.guidance_scale || 12.0,
          num_inference_steps: params.num_inference_steps || 35,
          strength: params.strength || 0.85
        }
      }
    });

    if (error) {
      throw new Error(`Edit failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from edit');
    }

    // Handle both single URL and array responses
    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Edited: ${asset.name}`,
      src: imageUrl,
      meta: { 
        width: asset.meta?.width || 1024, 
        height: asset.meta?.height || 1024, 
        instruction: params.instruction,
        originalAsset: asset.id,
        provider: 'replicate.edit'
      },
      createdAt: Date.now(),
    };
  }
};