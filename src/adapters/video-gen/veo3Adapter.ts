import { VideoGenAdapter, VideoGenParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if we should use mock mode (for development/testing without API)
const MOCK_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_VIDEO_MOCK_MODE === 'true';

export const veo3Adapter: VideoGenAdapter = {
  key: "replicate.veo-3",
  
  async generate(params: VideoGenParams): Promise<Asset> {
    console.log('VEO3Adapter - Generating video with params:', params);
    console.log('VEO3Adapter - Mock mode:', MOCK_MODE);
    
    // Mock mode for development/testing
    if (MOCK_MODE) {
      console.log('VEO3Adapter - Running in mock mode');
      toast.info('Video generation running in demo mode (no API configured)');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        id: crypto.randomUUID(),
        type: 'video',
        name: `VEO 3 (Demo): ${params.prompt.slice(0, 30)}...`,
        src: params.imageUrl || '', // Return the source image as placeholder
        meta: { 
          width: 1920,
          height: 1080,
          duration: params.duration || 5,
          prompt: params.prompt,
          provider: 'replicate.veo-3',
          model: 'veo-3-mock',
          motionStrength: params.motionStrength,
          aspectRatio: params.aspectRatio,
          seed: params.seed,
          isMock: true
        },
        createdAt: Date.now(),
      };
    }
    
    try {
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
        // Provide helpful error messages
        if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Failed to send')) {
          throw new Error(
            'Video generation service unavailable. Please ensure:\n' +
            '1. Edge functions are deployed\n' +
            '2. REPLICATE_API_TOKEN secret is configured\n' +
            'Contact support if the issue persists.'
          );
        }
        throw new Error(`Video generation failed: ${error.message}`);
      }

      if (!data?.output) {
        console.error('VEO3Adapter - No output received:', { data, error });
        throw new Error('No output received from video generation. The model may still be processing.');
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
    } catch (err) {
      console.error('VEO3Adapter - Error:', err);
      
      // Re-throw with more context
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during video generation');
    }
  }
};