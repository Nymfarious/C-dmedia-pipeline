import { Asset } from '@/types/media';

export interface AnimateDiffGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  motionStrength?: number;
  seed?: number;
  enableAudio?: boolean;
}

export const animateDiffAdapter = {
  key: "replicate.animatediff",
  
  async generate(params: AnimateDiffGenerationParams): Promise<Asset> {
    // For now, use VEO-3 adapter as fallback since AnimateDiff isn't implemented
    // In future, implement actual AnimateDiff API integration
    const { veo3Adapter } = await import('./veo3Adapter');
    return veo3Adapter.generate(params);
  }
};