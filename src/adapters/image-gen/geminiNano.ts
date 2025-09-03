import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';
import { resolveModelString } from '@/models/registry';

export const geminiNanoAdapter: ImageGenAdapter = {
  key: "replicate.nano", // Updated to use Replicate routing
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      console.log('Nano generation starting with params:', params);
      
      const modelString = resolveModelString('nano-banana');
      
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.UNIFIED, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: modelString,
          operation: 'generate',
          input: {
            prompt: params.prompt,
            width: params.width || 1024,
            height: params.height || 1024,
            steps: params.steps || 30,
            seed: params.seed,
            negative_prompt: params.negativePrompt || "blurred, distorted, artifacts, low quality"
          }
        })
      });

      if (!response.success || !response.data?.output) {
        throw new Error('No output received from Nano generation');
      }

      console.log('Nano generation successful:', response.data);

      return {
        id: crypto.randomUUID(),
        src: Array.isArray(response.data.output) ? response.data.output[0] : response.data.output,
        type: 'image' as const,
        name: `Generated_${Date.now()}.webp`,
        createdAt: Date.now(),
        category: 'generated',
        subcategory: 'AI Generated',
        meta: {
          width: params.width || 1024,
          height: params.height || 1024,
          operation: 'nano-generation',
          model: modelString,
          timestamp: new Date().toISOString(),
          prompt: params.prompt
        }
      };
    } catch (error) {
      console.error('Nano generation error:', error);
      throw error;
    }
  }
};