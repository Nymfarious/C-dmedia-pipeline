import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { makeApiRequest, API_CONFIG } from '@/config/api';
import { resolveModelString } from '@/models/registry';

export const geminiConversationalAdapter: ImageEditAdapter = {
  key: "replicate.conversational-edit", // Updated to use Replicate routing

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    try {
      // Route through unified Replicate endpoint
      const modelString = resolveModelString('nano-banana');
      
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.UNIFIED, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'replicate',
          model: modelString,
          operation: 'conversational-edit',
          input: {
            image: asset.src,
            instruction: params.instruction || "Edit this image",
            negative_prompt: "blurred, distorted, artifacts, low quality",
            guidance_scale: 7.5,
            num_inference_steps: 20,
            strength: 0.8
          }
        })
      });

      if (!response.success || !response.data?.output) {
        throw new Error('No output received from conversational edit');
      }

      const newAsset: Asset = {
        id: crypto.randomUUID(),
        type: 'image',
        name: `${asset.name || 'image'} - Conversational edited`,
        src: Array.isArray(response.data.output) ? response.data.output[0] : response.data.output,
        meta: {
          ...asset.meta,
          provider: 'replicate.conversational-edit',
          model: modelString,
          originalAsset: asset.id,
          editType: 'conversational',
          instruction: params.instruction,
          synthid_watermarked: true
        },
        createdAt: Date.now(),
        derivedFrom: asset.id,
        category: 'edited',
        subcategory: 'AI Conversational'
      };

      return newAsset;
    } catch (error) {
      console.error('Conversational edit error:', error);
      throw error;
    }
  }
};