import { z } from 'zod';

// Common schemas
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

// Response types
export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  echo?: T;
  data?: any;
}

export type FluxTxt2ImgRequest = z.infer<typeof FluxTxt2ImgSchema>;
export type SdxlImg2ImgRequest = z.infer<typeof SdxlImg2ImgSchema>;
export type SeedEditRequest = z.infer<typeof SeedEditSchema>;
export type BgRemoveRequest = z.infer<typeof BgRemoveSchema>;
export type UpscaleRequest = z.infer<typeof UpscaleSchema>;
export type I2VRequest = z.infer<typeof I2VSchema>;
export type TTSRequest = z.infer<typeof TTSSchema>;
export type SvgGenerateRequest = z.infer<typeof SvgGenerateSchema>;