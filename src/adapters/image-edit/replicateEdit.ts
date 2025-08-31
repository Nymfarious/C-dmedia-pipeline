import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { enhanceInpaintingPrompt, getOptimizedInpaintingParams } from '@/lib/promptEnhancer';

export const replicateEdit: ImageEditAdapter = {
  key: "replicate.edit",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl) {
      throw new Error('Mask is required for inpainting. Please create a mask by painting the area to edit.');
    }

    // Determine mode and enhance prompt
    const mode = 'replace'; // Default mode for general editing
    const enhancedPrompt = enhanceInpaintingPrompt({
      mode,
      userPrompt: params.instruction || 'Edit the masked area',
      context: asset.meta?.context
    });
    
    // Get optimized parameters
    const optimizedParams = getOptimizedInpaintingParams(mode);

    console.log('🎨 Enhanced editing with improved prompt:', {
      originalPrompt: params.instruction,
      enhancedPrompt: enhancedPrompt.prompt,
      negativePrompt: enhancedPrompt.negativePrompt
    });

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'flux-inpaint',
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl,
          prompt: enhancedPrompt.prompt,
          negative_prompt: enhancedPrompt.negativePrompt,
          guidance_scale: params.guidance_scale || optimizedParams.guidance_scale,
          num_inference_steps: params.num_inference_steps || optimizedParams.num_inference_steps,
          strength: params.strength || optimizedParams.strength
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