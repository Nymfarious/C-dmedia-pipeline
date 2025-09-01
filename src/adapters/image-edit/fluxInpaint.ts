import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { uploadMaskFromDataUrl, downloadAndUploadImage } from '@/lib/assetStorage';
import { enhanceInpaintingPrompt, getOptimizedInpaintingParams } from '@/lib/promptEnhancer';

export const fluxInpaintAdapter: ImageEditAdapter = {
  key: "replicate.flux-inpaint",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl) {
      throw new Error("Mask is required for inpainting. Paint the area to modify.");
    }

    // Determine the mode based on operation or instruction
    const mode = params.operation === 'advanced-object-removal' ? 'remove' :
                 params.operation === 'add-object' ? 'add' : 'replace';
    
    // Enhance the prompt for better results
    const enhancedPrompt = enhanceInpaintingPrompt({
      mode,
      userPrompt: params.instruction || "Inpaint the masked area",
      context: asset.meta?.context
    });
    
    // Get optimized parameters for this operation
    const optimizedParams = getOptimizedInpaintingParams(mode);
    
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

    console.log('🎨 FLUX Inpainting with enhanced prompt:', {
      mode,
      originalPrompt: params.instruction,
      enhancedPrompt: enhancedPrompt.prompt,
      negativePrompt: enhancedPrompt.negativePrompt,
      optimizedParams
    });

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'flux-inpaint',
        input: {
          image: imageUrl,
          mask: maskUpload.url,
          prompt: enhancedPrompt.prompt,
          negative_prompt: enhancedPrompt.negativePrompt,
          guidance_scale: params.guidance_scale || optimizedParams.guidance_scale,
          num_inference_steps: params.num_inference_steps || optimizedParams.num_inference_steps,
          strength: params.strength || optimizedParams.strength
        }
      }
    });

    if (error) {
      throw new Error(`FLUX inpainting failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from FLUX inpainting');
    }

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name || 'image'} - ${mode}d`,
      // Use the persisted Supabase URL directly (already handled by edge function)
      src: data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.flux-inpaint',
        originalAsset: asset.id,
        editType: 'inpainting',
        mode,
        originalPrompt: params.instruction,
        enhancedPrompt: enhancedPrompt.prompt,
        negativePrompt: enhancedPrompt.negativePrompt
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Inpainting'
    };

    return newAsset;
  }
};