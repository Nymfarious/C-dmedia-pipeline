import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const enhancedUpscalerAdapter: ImageEditAdapter = {
  key: "replicate.enhanced-upscale",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const scale = params.upscaleFactor || 2;
    const enhanceFaces = params.enhanceFaces || false;

    // Choose model based on whether face enhancement is needed
    const model = enhanceFaces 
      ? "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3"
      : "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

    const input = enhanceFaces 
      ? {
          img: asset.src,
          version: "v1.4",
          scale: scale
        }
      : {
          image: asset.src,
          scale: scale
        };

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model,
        operation: enhanceFaces ? 'face-enhance-upscale' : 'upscale',
        input
      }
    });

    if (error) {
      throw new Error(`Enhanced upscaling failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from enhanced upscaling');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Enhanced ${scale}x)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.enhanced-upscale',
        originalAsset: asset.id,
        width: (asset.meta?.width || 512) * scale,
        height: (asset.meta?.height || 512) * scale,
        upscaleFactor: scale,
        faceEnhanced: enhanceFaces,
        editType: 'enhanced-upscale'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Upscaled'
    };

    return newAsset;
  }
};