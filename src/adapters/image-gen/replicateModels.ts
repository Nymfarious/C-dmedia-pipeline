import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

// Generic Replicate adapter factory for all models
const createReplicateAdapter = (key: string, modelName: string): ImageGenAdapter => ({
  key,
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'generate',
        model: modelName,
        input: {
          prompt: params.prompt,
          num_outputs: 1,
          aspect_ratio: params.aspect || "1:1",
          output_format: "webp",
          output_quality: 80,
          negative_prompt: params.negativePrompt,
          seed: params.seed,
          guidance_scale: 3.5,
          num_inference_steps: 4
        }
      }
    });

    if (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }

    if (!data?.output || !Array.isArray(data.output) || data.output.length === 0) {
      throw new Error('No output received from generation');
    }

    const imageUrl = data.output[0];
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${modelName}: ${params.prompt.slice(0, 30)}...`,
      src: imageUrl,
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        provider: key,
        model: modelName,
        seed: params.seed
      },
      createdAt: Date.now(),
    };
  }
});

// Export all model adapters
export const fluxSchnellAdapter = createReplicateAdapter('replicate.flux-schnell', 'flux-schnell');
export const fluxDevAdapter = createReplicateAdapter('replicate.flux-dev', 'flux-dev');  
export const fluxProAdapter = createReplicateAdapter('replicate.flux-pro', 'flux-pro');
export const fluxUltraAdapter = createReplicateAdapter('replicate.flux-ultra', 'flux-ultra');

export const sdxlAdapter = createReplicateAdapter('replicate.sdxl', 'sdxl');
export const sdTurboAdapter = createReplicateAdapter('replicate.sd-turbo', 'sd-turbo');
export const sd15Adapter = createReplicateAdapter('replicate.sd-1-5', 'sd-1-5');
export const sdxlLightningAdapter = createReplicateAdapter('replicate.sdxl-lightning', 'sdxl-lightning');

export const realVisAdapter = createReplicateAdapter('replicate.real-vis', 'real-vis');
export const dreamshaperAdapter = createReplicateAdapter('replicate.dreamshaper', 'dreamshaper');
export const deliberateAdapter = createReplicateAdapter('replicate.deliberate', 'deliberate');
export const realisticVisionAdapter = createReplicateAdapter('replicate.realistic-vision', 'realistic-vision');

export const animeDiffusionAdapter = createReplicateAdapter('replicate.anime-diffusion', 'anime-diffusion');
export const anythingV5Adapter = createReplicateAdapter('replicate.anything-v5', 'anything-v5');
export const nijiDiffusionAdapter = createReplicateAdapter('replicate.niji-diffusion', 'niji-diffusion');
export const openjourneyAdapter = createReplicateAdapter('replicate.openjourney', 'openjourney');

export const midjourneyV4Adapter = createReplicateAdapter('replicate.midjourney-v4', 'midjourney-v4');
export const protogenAdapter = createReplicateAdapter('replicate.protogen', 'protogen');
export const synthwaveAdapter = createReplicateAdapter('replicate.synthwave', 'synthwave');
export const vanGoghAdapter = createReplicateAdapter('replicate.van-gogh', 'van-gogh');

export const dallECloneAdapter = createReplicateAdapter('replicate.dall-e-clone', 'dall-e-clone');
export const playgroundV2Adapter = createReplicateAdapter('replicate.playground-v2', 'playground-v2');

export const logoDiffusionAdapter = createReplicateAdapter('replicate.logo-diffusion', 'logo-diffusion');
export const interiorDesignAdapter = createReplicateAdapter('replicate.interior-design', 'interior-design');
export const fashionDiffusionAdapter = createReplicateAdapter('replicate.fashion-diffusion', 'fashion-diffusion');