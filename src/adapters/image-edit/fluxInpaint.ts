import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { uploadMaskFromDataUrl, downloadAndUploadImage } from '@/lib/assetStorage';

export const fluxInpaintAdapter: ImageEditAdapter = {
  key: "replicate.flux-inpaint",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl) {
      throw new Error("Mask is required for inpainting. Paint the area to modify.");
    }

    const prompt = params.instruction || "Inpaint the masked area";
    
    // Upload mask to storage
    const maskUpload = await uploadMaskFromDataUrl(params.maskPngDataUrl);
    if (maskUpload.error) {
      throw new Error(`Failed to upload mask: ${maskUpload.error}`);
    }

    // Ensure image is in our storage
    let imageUrl = asset.src;
    if (!asset.src.includes(supabase.storage.from('ai-images').getPublicUrl('').data.publicUrl)) {
      const imageUpload = await downloadAndUploadImage(asset.src);
      if (!imageUpload.error) {
        imageUrl = imageUpload.url;
      }
    }

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'flux-inpaint',
        input: {
          image: imageUrl,
          mask: maskUpload.url,
          prompt,
          negative_prompt: "blurred, distorted, artifacts",
          guidance_scale: 3.5,
          num_inference_steps: 28,
          strength: 0.8
        }
      }
    });

    if (error) {
      throw new Error(`FLUX inpainting failed: ${error.message}`);
    }

    if (!data?.output?.[0]) {
      throw new Error('No output received from FLUX inpainting');
    }

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name || 'image'} - inpainted`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.flux-inpaint',
        originalAsset: asset.id,
        editType: 'inpainting',
        prompt
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Inpainting'
    };

    return newAsset;
  }
};