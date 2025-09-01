import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const upscalerAdapter: ImageEditAdapter = {
  key: "replicate.upscale",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        operation: 'upscale',
        input: {
          image: asset.src,
          scale: (params as any).scale || 2
        }
      }
    });

    if (error) {
      throw new Error(`Upscaling failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from upscaling');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Upscaled)`,
      // Use the persisted Supabase URL directly (already handled by edge function)
      src: data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.upscale',
        originalAsset: asset.id,
        width: (asset.meta?.width || 512) * ((params as any).scale || 2),
        height: (asset.meta?.height || 512) * ((params as any).scale || 2)
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };

    return newAsset;
  }
};