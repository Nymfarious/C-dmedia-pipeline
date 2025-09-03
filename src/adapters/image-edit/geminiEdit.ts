import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';
import { resolveModelString } from '@/models/registry';

export const geminiEditAdapter: ImageEditAdapter = {
  key: "replicate.gemini-edit", // Updated to use Replicate routing
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    try {
      // Route through unified Replicate endpoint
      const modelString = resolveModelString('flash-1');
      
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.UNIFIED, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: modelString,
          operation: 'edit',
          input: {
            image: asset.src,
            instruction: params.instruction,
            mask: params.maskAssetId ? asset.src : undefined
          }
        })
      });

      if (!response.success || !response.data?.output) {
        throw new Error('No output received from edit operation');
      }

      return {
        id: crypto.randomUUID(),
        src: response.data.output,
        type: 'image',
        name: `${asset.name || 'image'} - Edited`,
        createdAt: Date.now(),
        category: 'edited',
        meta: {
          provider: 'replicate.gemini-edit',
          model: modelString,
          originalAsset: asset.id,
          editParams: params
        }
      };
    } catch (error) {
      console.error('Edit error:', error);
      throw error;
    }
  }
};