import { z } from 'zod';

// Unified request schemas with provider selection
export const UnifiedImageGenSchema = z.object({
  provider: z.enum(['replicate', 'gemini']),
  model: z.string().optional(),
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  seed: z.number().optional(),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
  numOutputs: z.number().min(1).max(4).optional(),
  scheduler: z.string().optional(),
  mode: z.enum(['ultra', 'raw']).optional(), // FLUX specific
  aspectRatio: z.string().optional(),
});

export const UnifiedImageEditSchema = z.object({
  provider: z.enum(['replicate', 'gemini']),
  model: z.string().optional(),
  imageUrl: z.string().url(),
  instruction: z.string().min(1),
  maskUrl: z.string().url().optional(),
  strength: z.number().min(0).max(1).optional(),
  seed: z.number().optional(),
});

export const UnifiedImg2ImgSchema = z.object({
  provider: z.enum(['replicate', 'gemini']),
  model: z.string().optional(),
  imageUrl: z.string().url(),
  prompt: z.string().optional(),
  controlnet: z.enum(['openpose', 'canny', 'depth']).optional(),
  poseUrl: z.string().url().optional(),
  strength: z.number().min(0).max(1).optional(),
  seed: z.number().optional(),
});

export const UnifiedBgRemoveSchema = z.object({
  provider: z.enum(['replicate', 'banana']),
  model: z.string().optional(),
  imageUrl: z.string().url(),
});

export const UnifiedUpscaleSchema = z.object({
  provider: z.enum(['replicate']),
  model: z.string().optional(),
  imageUrl: z.string().url(),
  scale: z.enum([2, 3, 4]).optional(),
  faceEnhance: z.boolean().optional(),
});

export const UnifiedI2VSchema = z.object({
  provider: z.enum(['replicate']),
  model: z.string().optional(),
  imageUrl: z.string().url(),
  prompt: z.string().optional(),
  numFrames: z.number().min(8).max(120).optional(),
  seconds: z.number().min(1).max(10).optional(),
});

export const UnifiedTTSSchema = z.object({
  provider: z.enum(['replicate']),
  model: z.string().optional(),
  text: z.string().min(1),
  voice: z.string().optional(),
  voiceUrl: z.string().url().optional(), // For voice cloning
  language: z.string().optional(),
});

export const UnifiedSVGSchema = z.object({
  provider: z.enum(['replicate']),
  model: z.string().optional(),
  prompt: z.string().min(1),
  style: z.string().optional(),
});

// Legacy schemas for backward compatibility
export const FluxTxt2ImgSchema = z.object({
  prompt: z.string().min(1),
  seed: z.number().optional(),
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
});

export const SdxlImg2ImgSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().optional(),
  controlnet: z.enum(['openpose']).optional(),
  poseUrl: z.string().url().optional(),
});

export const SeedEditSchema = z.object({
  imageUrl: z.string().url(),
  instruction: z.string().min(1),
});

export const BgRemoveSchema = z.object({
  imageUrl: z.string().url(),
});

export const UpscaleSchema = z.object({
  imageUrl: z.string().url(),
  scale: z.enum([2, 3, 4]).optional(),
});

export const I2VSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().optional(),
  seconds: z.number().min(1).max(10).optional(),
});

export const TTSSchema = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
});

export const SvgGenerateSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional(),
});

// Unified Asset response
export interface AssetResponse {
  id: string;
  type: 'image' | 'audio' | 'animation';
  name: string;
  src: string;
  meta?: Record<string, any>;
  createdAt: number;
}

// Response types
export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  echo?: T;
  data?: any;
  asset?: AssetResponse;
}

// Provider model definitions
export const REPLICATE_MODELS = {
  // Image Generation
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-1.1-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
  'sdxl-base': 'stability-ai/sdxl',
  // Image Editing
  'seededit-3.0': 'bytedance/seededit-3.0',
  'sdxl-controlnet-openpose': 'lucataco/sdxl-controlnet-openpose',
  // Background Removal
  'bg-remover': '851-labs/background-remover',
  'rembg': 'rembg/rembg',
  // Upscaling
  'real-esrgan': 'nightmareai/real-esrgan',
  'gfpgan': 'tencentarc/gfpgan',
  // Video
  'i2vgen-xl': 'ali-vilab/i2vgen-xl',
  // Audio
  'xtts-v2': 'coqui/xtts-v2',
  'kokoro-82m': 'kokoro-ai/kokoro-82m',
  // SVG
  'recraft-v3-svg': 'recraft-ai/recraft-v3-svg',
} as const;

export const GEMINI_MODELS = {
  'gemini-2.5-flash-image': 'gemini-2.5-flash-image',
} as const;

// Type exports
export type UnifiedImageGenRequest = z.infer<typeof UnifiedImageGenSchema>;
export type UnifiedImageEditRequest = z.infer<typeof UnifiedImageEditSchema>;
export type UnifiedImg2ImgRequest = z.infer<typeof UnifiedImg2ImgSchema>;
export type UnifiedBgRemoveRequest = z.infer<typeof UnifiedBgRemoveSchema>;
export type UnifiedUpscaleRequest = z.infer<typeof UnifiedUpscaleSchema>;
export type UnifiedI2VRequest = z.infer<typeof UnifiedI2VSchema>;
export type UnifiedTTSRequest = z.infer<typeof UnifiedTTSSchema>;
export type UnifiedSVGRequest = z.infer<typeof UnifiedSVGSchema>;

export type FluxTxt2ImgRequest = z.infer<typeof FluxTxt2ImgSchema>;
export type SdxlImg2ImgRequest = z.infer<typeof SdxlImg2ImgSchema>;
export type SeedEditRequest = z.infer<typeof SeedEditSchema>;
export type BgRemoveRequest = z.infer<typeof BgRemoveSchema>;
export type UpscaleRequest = z.infer<typeof UpscaleSchema>;
export type I2VRequest = z.infer<typeof I2VSchema>;
export type TTSRequest = z.infer<typeof TTSSchema>;
export type SvgGenerateRequest = z.infer<typeof SvgGenerateSchema>;