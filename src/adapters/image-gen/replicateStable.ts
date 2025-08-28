import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const replicateStable: ImageGenAdapter = {
  key: "replicate.sd",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        operation: 'generate',
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || "",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 5,
          seed: params.seed
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
      name: `Stable Diffusion: ${params.prompt.slice(0, 30)}...`,
      src: imageUrl,
      meta: {
        width: 1024,
        height: 1024,
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        provider: 'replicate.sd',
        model: 'sdxl',
        seed: params.seed
      },
      createdAt: Date.now(),
    };
  }
};