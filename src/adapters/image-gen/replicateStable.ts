import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const replicateStable: ImageGenAdapter = {
  key: "replicate.sd",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    console.log('ReplicateStable - Generating with params:', params);
    
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'generate',
        model: 'sdxl',
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || "",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 5,
          num_inference_steps: 50,
          seed: params.seed
        }
      }
    });

    console.log('ReplicateStable - Response:', { data, error });

    if (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }

    if (!data?.output) {
      console.error('ReplicateStable - No output received:', { data, error });
      throw new Error('No output received from generation');
    }

    const imageUrl = data.output;
    
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