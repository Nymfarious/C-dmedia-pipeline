import { Asset } from '@/types/media';

export interface StableVideoGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  motionStrength?: number;
  seed?: number;
  enableAudio?: boolean;
}

export const stableVideoAdapter = {
  key: "replicate.stable-video",
  
  async generate(params: StableVideoGenerationParams): Promise<Asset> {
    // For now, use VEO-3 adapter as fallback since Stable Video isn't implemented
    // In future, implement actual Stable Video Diffusion API integration
    const { veo3Adapter } = await import('./veo3Adapter');
    return veo3Adapter.generate(params);
  }
};