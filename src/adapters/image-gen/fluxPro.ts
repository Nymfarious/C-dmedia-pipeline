import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';

export const fluxProAdapter: ImageGenAdapter = {
  key: "flux.pro",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: 'flux-1.1-pro',
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          seed: params.seed,
          width: 1024,
          height: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Generation failed');
      }

      return result.asset;
    } catch (error) {
      console.error('Flux Pro generation error:', error);
      throw error; // Remove misleading fallback
    }
  }
};