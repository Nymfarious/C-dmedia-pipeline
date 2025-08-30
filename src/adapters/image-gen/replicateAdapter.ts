import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const replicateAdapter: ImageGenAdapter = {
  key: "replicate.flux",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'generate',
        model: 'flux-schnell', 
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
      name: `Flux: ${params.prompt.slice(0, 30)}...`,
      src: imageUrl,
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        provider: 'replicate.flux',
        model: 'flux-schnell',
        seed: params.seed
      },
      createdAt: Date.now(),
    };
  }
};