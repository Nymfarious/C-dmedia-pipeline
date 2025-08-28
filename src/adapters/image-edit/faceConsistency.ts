import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const faceConsistencyAdapter: ImageEditAdapter = {
  key: "replicate.face-id",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.targetImageUrl && !params.referenceImageUrl) {
      throw new Error('Target or reference image required for face consistency');
    }

    let operation = 'face-swap';
    let instruction = params.instruction || 'Perform face swap while maintaining natural appearance';

    if (params.referenceImageUrl && !params.targetImageUrl) {
      operation = 'identity-preserve';
      instruction = 'Preserve the identity from the reference image while maintaining the current pose and expression';
    }

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "zsxkib/instant-id:f040d6bf93e5d7e6ed6c5e4e7ecf23e3ac6b9c76b8b3daf5a1ad8d4c0da66b3d",
        operation,
        input: {
          image: asset.src,
          face_image: params.targetImageUrl || params.referenceImageUrl,
          prompt: instruction,
          negative_prompt: "blurred, distorted, artifacts, unnatural face",
          seed: Math.floor(Math.random() * 1000000),
          guidance_scale: 5.0,
          num_inference_steps: 30,
          identity_strength: 0.8,
          adapter_strength: 0.8,
          style_name: "Photographic (Default)"
        }
      }
    });

    if (error) {
      throw new Error(`Face consistency operation failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from face consistency operation');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Face ${operation === 'face-swap' ? 'Swapped' : 'Enhanced'})`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.face-id',
        originalAsset: asset.id,
        editType: operation,
        faceImageUrl: params.targetImageUrl || params.referenceImageUrl
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Face Enhanced'
    };

    return newAsset;
  }
};