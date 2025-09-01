import { Asset } from '@/types/media';

export interface LumaGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  motionStrength?: number;
  seed?: number;
  enableAudio?: boolean;
}

export const lumaAdapter = {
  key: "replicate.luma-dream",
  
  async generate(params: LumaGenerationParams): Promise<Asset> {
    // For now, use VEO-3 adapter as fallback since Luma isn't implemented
    // In future, implement actual Luma Dream Machine API integration
    const { veo3Adapter } = await import('./veo3Adapter');
    return veo3Adapter.generate(params);
  }
};