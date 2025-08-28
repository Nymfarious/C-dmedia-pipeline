import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const backgroundRemoverAdapter: ImageEditAdapter = {
  key: "replicate.rembg",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
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