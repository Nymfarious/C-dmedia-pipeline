import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';
import { resolveModelString, getDefaultModel } from '@/models/registry';

/**
 * Unified Replicate image edit adapter
 * Routes all edit operations through Replicate, including former Gemini operations
 */
export const replicateUnifiedEditAdapter: ImageEditAdapter = {
  key: "replicate.unified-edit",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    try {
      // Determine the appropriate model based on operation type
      let mode = 'image-edit';
      if (params.instruction?.toLowerCase().includes('conversation') || 
          params.instruction?.toLowerCase().includes('chat')) {
        mode = 'conversational-edit';
      }

      const modelString = resolveModelString(getDefaultModel(mode));

      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.IMAGE.EDIT, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: modelString,
          imageUrl: asset.src,
          instruction: params.instruction,
          maskUrl: params.maskAssetId ? asset.src : undefined,
          strength: params.strength || 0.8
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Edit failed');
      }

      return {
        ...result.asset,
        derivedFrom: asset.id,
        category: 'edited',
        subcategory: 'AI Enhanced'
      };
    } catch (error) {
      console.error('Replicate unified edit error:', error);
      throw error;
    }
  }
};