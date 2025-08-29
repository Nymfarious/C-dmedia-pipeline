import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { uploadMaskFromDataUrl, downloadAndUploadImage } from '@/lib/assetStorage';

export const objectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.object-remove",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl && !params.maskBlob) {
      throw new Error("No mask provided. Paint an area to remove first.");
    }
    const instruction = params.removeObjectInstruction || params.instruction || "Remove the marked objects cleanly";

    // Upload mask to storage
    const maskUpload = await uploadMaskFromDataUrl(params.maskPngDataUrl!);
    if (maskUpload.error) {
      throw new Error(`Failed to upload mask: ${maskUpload.error}`);
    }

    // Ensure image is also in our storage
    let imageUrl = asset.src;
    if (!asset.src.includes(supabase.storage.from('ai-images').getPublicUrl('').data.publicUrl)) {
      const imageUpload = await downloadAndUploadImage(asset.src);
      if (!imageUpload.error) {
        imageUrl = imageUpload.url;
      }
    }

    // Call enhanced Supabase edge function
    const body = {
      operation: "object-removal",
      input: {
        image: imageUrl,
        mask_instruction: instruction,
        mask: maskUpload.url
      }
    };

    const { data: result, error } = await supabase.functions.invoke('replicate-enhanced', {
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