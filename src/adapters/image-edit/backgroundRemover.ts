import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const backgroundRemoverAdapter: ImageEditAdapter = {
  key: "replicate.rembg",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'background-removal',
        input: {
          image: asset.src
        }
      }
    });

    if (error) {
      throw new Error(`Background removal failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from background removal');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Background Removed)`,
      src: data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.rembg',
        originalAsset: asset.id
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };

    return newAsset;
  }
};