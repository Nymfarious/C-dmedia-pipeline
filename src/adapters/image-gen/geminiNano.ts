import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';

export const geminiNanoAdapter: ImageGenAdapter = {
  key: "gemini.nano",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'gemini',
          model: 'gemini-2.5-flash-image',
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
      console.error('Gemini Nano generation error:', error);
      throw error; // Remove misleading fallback
    }
  }
};