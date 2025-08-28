import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const objectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.object-remove",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl && !params.maskBlob) {
      throw new Error("No mask provided. Paint an area to remove first.");
    }
    const instruction = params.removeObjectInstruction || params.instruction || "Remove the marked objects cleanly";

    // Call Supabase edge function for Replicate
    const body = {
      model: "andreasjansson/remove-object:ee05b83ade94cd0e11628243fb5c043fffe64d2e3b32f3afe83b6aec8b50a7ab",
      operation: "object-removal",
      input: {
        image: asset.src,
        mask_instruction: instruction,
        mask: params.maskPngDataUrl
      }
    };

    const { data: result, error } = await supabase.functions.invoke('replicate', {
      body
    });

    if (error) throw new Error(`Edit failed: ${error.message}`);
    if (!result?.output?.[0]) throw new Error("Edit failed - no output");

    // Normalize to Asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name || 'image'} - object removed`,
      src: Array.isArray(result.output) ? result.output[0] : result.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.object-remove',
        originalAsset: asset.id,
        editType: 'object-removal',
        instruction
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Cleanup'
    };

    return newAsset;
  }
};