import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const poseAdjustmentAdapter: ImageEditAdapter = {
  key: "replicate.pose",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.poseAdjustments) {
      throw new Error('Pose adjustments required for pose editing');
    }

    // Convert pose keypoints to OpenPose format
    const poseInstruction = `Adjust the pose according to these keypoint positions: ${
      params.poseAdjustments.map(kp => `${kp.label} at (${kp.x}, ${kp.y})`).join(', ')
    }`;

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "jagilley/controlnet-pose:0bddd1d4f613314e378a654de3e8648d5d4d5e4a1cf8de3e6d1e3acef4c5555e",
        operation: 'pose-adjustment',
        input: {
          image: asset.src,
          pose_instruction: poseInstruction,
          prompt: params.instruction || "Adjust the pose while maintaining image quality",
          negative_prompt: "blurred, distorted, artifacts, unnatural pose",
          seed: Math.floor(Math.random() * 1000000),
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.8
        }
      }
    });

    if (error) {
      throw new Error(`Pose adjustment failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from pose adjustment');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Pose Adjusted)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.pose',
        originalAsset: asset.id,
        editType: 'pose-adjustment',
        poseAdjustments: params.poseAdjustments
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Pose Adjusted'
    };

    return newAsset;
  }
};