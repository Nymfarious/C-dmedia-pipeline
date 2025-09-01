import { Asset } from '@/types/media';

export interface RunwayGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  motionStrength?: number;
  seed?: number;
  enableAudio?: boolean;
}

export const runwayAdapter = {
  key: "replicate.runway-ml",
  
  async generate(params: RunwayGenerationParams): Promise<Asset> {
    // For now, use VEO-3 adapter as fallback since RunwayML isn't implemented
    // In future, implement actual RunwayML API integration
    const { veo3Adapter } = await import('./veo3Adapter');
    return veo3Adapter.generate(params);
  }
};