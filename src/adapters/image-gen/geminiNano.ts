import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const geminiNanoAdapter: ImageGenAdapter = {
  key: "gemini.nano",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      console.log('Gemini Nano generation starting with params:', params);
      
      const { data, error } = await supabase.functions.invoke('gemini-nano', {
        body: {
          operation: 'conversational-edit',
          input: {
            instruction: params.prompt,
            negative_prompt: params.negativePrompt || "blurred, distorted, artifacts, low quality",
            guidance_scale: 7.5,
            num_inference_steps: 20,
            strength: 0.8,
            seed: params.seed
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Generation failed: ${error.message}`);
      }

      if (!data?.output || !Array.isArray(data.output) || data.output.length === 0) {
        throw new Error('No image generated');
      }

      const imageUrl = data.output[0];
      
      return {
        id: crypto.randomUUID(),
        src: imageUrl,
        type: 'image' as const,
        name: `Generated_${Date.now()}.webp`,
        createdAt: Date.now(),
        category: 'generated',
        subcategory: 'AI Generated',
        meta: {
          width: 1024,
          height: 1024,
          operation: 'gemini-nano-generation',
          model: 'nano-banana',
          timestamp: new Date().toISOString(),
          ...data.metadata
        }
      };
    } catch (error) {
      console.error('Gemini Nano generation error:', error);
      throw error;
    }
  }
};