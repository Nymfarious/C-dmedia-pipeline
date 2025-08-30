import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const openaiAdapter: ImageGenAdapter = {
  key: "openai.dall-e",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('openai-image', {
      body: {
        prompt: params.prompt,
        model: 'gpt-image-1',
        size: params.aspect === '16:9' ? '1792x1024' : params.aspect === '9:16' ? '1024x1792' : '1024x1024',
        quality: 'high',
        output_format: 'webp'
      }
    });

    if (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }

    if (!data?.image) {
      throw new Error('No image received from OpenAI');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `OpenAI: ${params.prompt.slice(0, 30)}...`,
      src: data.image,
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        provider: 'openai.dall-e',
        model: 'gpt-image-1'
      },
      createdAt: Date.now(),
    };
  }
};