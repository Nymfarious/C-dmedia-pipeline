import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';
import { resolveModelString, getDefaultModel } from '@/models/registry';

/**
 * Unified Replicate adapter that routes all requests through our backend
 * Replaces all direct Gemini/Google integrations
 */
export const replicateUnifiedAdapter: ImageGenAdapter = {
  key: "replicate.unified",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      // Use default model for txt2img
      const modelString = resolveModelString(getDefaultModel('txt2img'));

      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: modelString,
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          numOutputs: 1
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
      console.error('Replicate unified generation error:', error);
      throw error;
    }
  }
};