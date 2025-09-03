import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';

export const fluxUltraAdapter: ImageGenAdapter = {
  key: "flux.ultra",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: 'flux-1.1-ultra',
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          seed: params.seed,
          width: 1024,
          height: 1024,
          mode: 'ultra',
        }),
      });

      if (!response.success) {
        throw new Error(`Generation failed: ${response.error}`);
      }

      const result = response.data;
      
      if (!result.ok) {
        throw new Error(result.message || 'Generation failed');
      }

      return result.asset;
    } catch (error) {
      console.error('Flux Ultra generation error:', error);
      throw error; // Remove misleading fallback
    }
  }
};