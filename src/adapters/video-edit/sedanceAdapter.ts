import { VideoEditAdapter, VideoEditParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const sedanceAdapter: VideoEditAdapter = {
  key: "replicate.sedance-1-pro",
  
  async edit(asset: Asset, params: VideoEditParams): Promise<Asset> {
    console.log('SeDance-1 Pro - Editing video with params:', params);
    
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'video-edit',
        model: 'sedance-1-pro',
        input: {
          video: asset.src,
          prompt: params.prompt,
          instruction: params.instruction || 'Edit this video with natural motion',
          motion_strength: params.motionStrength || 0.8,
          structure_strength: params.structureStrength || 0.7,
          seed: params.seed,
          num_frames: params.numFrames || 16,
          fps: params.fps || 8,
          aspect_ratio: params.aspectRatio || "16:9"
        }
      }
    });

    console.log('SeDance-1 Pro - Response:', { data, error });

    if (error) {
      throw new Error(`SeDance-1 Pro video editing failed: ${error.message}`);
    }

    if (!data?.output) {
      console.error('SeDance-1 Pro - No output received:', { data, error });
      throw new Error('No output received from SeDance-1 Pro video editing');
    }

    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    
    return {
      id: crypto.randomUUID(),
      type: 'video',
      name: `SeDance: ${params.prompt?.slice(0, 30)}...`,
      src: videoUrl,
      meta: { 
        width: 1920,
        height: 1080,
        duration: (params.numFrames || 16) / (params.fps || 8),
        prompt: params.prompt,
        instruction: params.instruction,
        provider: 'replicate.sedance-1-pro',
        model: 'sedance-1-pro',
        motionStrength: params.motionStrength,
        structureStrength: params.structureStrength,
        aspectRatio: params.aspectRatio,
        seed: params.seed,
        originalAsset: asset.id
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};