import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const objectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.object-remove",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.brushMask || params.brushMask.length === 0) {
      throw new Error('Brush mask required for object removal');
    }

    // Convert brush strokes to a simple mask instruction
    const maskDescription = `Remove the objects marked by ${params.brushMask.length} brush strokes`;

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "cjwbw/seededit:f73fe4746be8d7feba9a20dd7b6e02be75ce73c6c2a7df14d7f31e95b2f19e6f",
        operation: 'object-removal',
        input: {
          image: asset.src,
          prompt: params.instruction || "Remove the marked objects cleanly",
          editing_instruction: maskDescription,
          negative_prompt: "blurred, distorted, artifacts",
          seed: Math.floor(Math.random() * 1000000),
          guidance_scale: 7.5,
          num_inference_steps: 20
        }
      }
    });

    if (error) {
      throw new Error(`Object removal failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from object removal');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Objects Removed)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.object-remove',
        originalAsset: asset.id,
        editType: 'object-removal'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Enhanced'
    };

    return newAsset;
  }
};