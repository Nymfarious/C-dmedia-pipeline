import { VideoGenAdapter, VideoGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const veo3Adapter: VideoGenAdapter = {
  key: "replicate.veo-3",
  
  async generate(params: VideoGenParams): Promise<Asset> {
    console.log('VEO3Adapter - Generating video with params:', params);
    
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'image-to-video',
        model: 'veo-3',
        input: {
          prompt: params.prompt,
          image: params.imageUrl,
          duration: params.duration || 5,
          aspect_ratio: params.aspectRatio || "16:9",
          motion_strength: params.motionStrength || 0.8,
          seed: params.seed
        }
      }
    });

    console.log('VEO3Adapter - Response:', { data, error });

    if (error) {
      throw new Error(`Video generation failed: ${error.message}`);
    }

    if (!data?.output) {
      console.error('VEO3Adapter - No output received:', { data, error });
      throw new Error('No output received from video generation');
    }

    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    
    return {
      id: crypto.randomUUID(),
      type: 'video',
      name: `VEO 3: ${params.prompt.slice(0, 30)}...`,
      src: videoUrl,
      meta: { 
        width: 1920,
        height: 1080,
        duration: params.duration || 5,
        prompt: params.prompt,
        provider: 'replicate.veo-3',
        model: 'veo-3',
        motionStrength: params.motionStrength,
        aspectRatio: params.aspectRatio,
        seed: params.seed
      },
      createdAt: Date.now(),
    };
  }
};