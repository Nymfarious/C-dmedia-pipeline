import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const huggingfaceAdapter: ImageGenAdapter = {
  key: "huggingface.flux",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('huggingface-image', {
      body: {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        model: 'black-forest-labs/FLUX.1-schnell'
      }
    });

    if (error) {
      throw new Error(`Hugging Face generation failed: ${error.message}`);
    }

    if (!data?.image) {
      throw new Error('No image received from Hugging Face');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `HF Flux: ${params.prompt.slice(0, 30)}...`,
      // Note: Hugging Face adapter should also be updated to persist to storage
      src: data.image,
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        provider: 'huggingface.flux',
        model: 'FLUX.1-schnell'
      },
      createdAt: Date.now(),
    };
  }
};