import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const replicateEdit: ImageEditAdapter = {
  key: "replicate.edit",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'nano-banana-edit',
        input: {
          image: asset.src,
          instruction: params.instruction || 'Edit this image',
          negative_prompt: "blurred, distorted, artifacts, low quality",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.8
        }
      }
    });

    if (error) {
      throw new Error(`Edit failed: ${error.message}`);
    }

    if (!data?.output || !Array.isArray(data.output) || data.output.length === 0) {
      throw new Error('No output received from edit');
    }

    const imageUrl = data.output[0];
    
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