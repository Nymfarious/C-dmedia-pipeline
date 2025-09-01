import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';

export const geminiEditAdapter: ImageEditAdapter = {
  key: "gemini.edit",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.EDIT, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'gemini',
          model: 'gemini-2.5-flash-image',
          imageUrl: asset.src,
          instruction: params.instruction,
          maskUrl: params.maskAssetId ? asset.src : undefined, // TODO: get actual mask asset
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Edit failed');
      }

      return result.asset;
    } catch (error) {
      console.error('Gemini edit error:', error);
      throw error; // Remove misleading fallback
    }
  }
};