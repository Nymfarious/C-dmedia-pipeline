/**
 * Centralized model registry for all AI providers
 * Route everything through Replicate to simplify architecture
 */

export interface ModelSpec {
  provider: 'replicate';
  model: string;
  modes: string[];
  supports: {
    alpha_out: boolean;
    lora: boolean;
    max_size: [number, number];
  };
}

export const MODELS = {
  // Google models via Replicate
  "nano-banana": {
    provider: "replicate",
    model: "google/nano-banana:latest",
    modes: ["image-edit", "txt2img", "conversational-edit"],
    supports: { alpha_out: false, lora: false, max_size: [1536, 1536] }
  },
  "flash-1": {
    provider: "replicate", 
    model: "google/flash-1:latest",
    modes: ["txt2img", "inpaint"],
    supports: { alpha_out: false, lora: false, max_size: [2048, 2048] }
  },
  
  // Black Forest Labs models
  "flux-1": {
    provider: "replicate",
    model: "black-forest-labs/flux-1:latest", 
    modes: ["txt2img", "inpaint"],
    supports: { alpha_out: false, lora: true, max_size: [1536, 1536] }
  },
  "flux-schnell": {
    provider: "replicate",
    model: "black-forest-labs/flux-schnell:latest",
    modes: ["txt2img"],
    supports: { alpha_out: false, lora: false, max_size: [1024, 1024] }
  },
  "flux-dev": {
    provider: "replicate",
    model: "black-forest-labs/flux-dev:latest",
    modes: ["txt2img", "img2img"],
    supports: { alpha_out: false, lora: true, max_size: [1536, 1536] }
  },
  "flux-pro": {
    provider: "replicate",
    model: "black-forest-labs/flux-1.1-pro:latest",
    modes: ["txt2img", "img2img", "inpaint"],
    supports: { alpha_out: false, lora: true, max_size: [2048, 2048] }
  },
  
  // Stable Diffusion family
  "sdxl": {
    provider: "replicate",
    model: "stability-ai/sdxl:latest",
    modes: ["txt2img", "img2img", "inpaint"],
    supports: { alpha_out: false, lora: true, max_size: [1024, 1024] }
  },
  
  // Image editing models
  "seededit": {
    provider: "replicate",
    model: "bytedance/seededit-3.0:latest",
    modes: ["image-edit"],
    supports: { alpha_out: false, lora: false, max_size: [1024, 1024] }
  },
  
  // Background removal
  "bg-remover": {
    provider: "replicate",
    model: "rembg/rembg:latest",
    modes: ["bg-remove"],
    supports: { alpha_out: true, lora: false, max_size: [2048, 2048] }
  },
  
  // Upscaling
  "real-esrgan": {
    provider: "replicate",
    model: "nightmareai/real-esrgan:latest", 
    modes: ["upscale"],
    supports: { alpha_out: false, lora: false, max_size: [4096, 4096] }
  },
  
  // Video generation
  "i2v-gen": {
    provider: "replicate",
    model: "ali-vilab/i2vgen-xl:latest",
    modes: ["i2v"],
    supports: { alpha_out: false, lora: false, max_size: [1024, 1024] }
  },
  
  // Audio/TTS
  "xtts-v2": {
    provider: "replicate",
    model: "coqui/xtts-v2:latest",
    modes: ["tts"],
    supports: { alpha_out: false, lora: false, max_size: [0, 0] }
  },
  
  // SVG generation
  "recraft-svg": {
    provider: "replicate",
    model: "recraft-ai/recraft-v3-svg:latest",
    modes: ["svg"],
    supports: { alpha_out: false, lora: false, max_size: [1024, 1024] }
  }
} as const satisfies Record<string, ModelSpec>;

export type ModelKey = keyof typeof MODELS;

/**
 * Get model spec by key
 */
export function getModel(key: ModelKey): ModelSpec {
  return MODELS[key];
}

/**
 * Get all models that support a specific mode
 */
export function getModelsByMode(mode: string): ModelKey[] {
  return (Object.entries(MODELS) as [ModelKey, ModelSpec][])
    .filter(([_, spec]) => spec.modes.includes(mode))
    .map(([key]) => key);
}

/**
 * Get the default model for a specific mode
 */
export function getDefaultModel(mode: string): ModelKey {
  const models = getModelsByMode(mode);
  if (models.length === 0) {
    throw new Error(`No models found for mode: ${mode}`);
  }
  
  // Define defaults for common modes
  const defaults: Record<string, ModelKey> = {
    'txt2img': 'flux-pro',
    'image-edit': 'nano-banana',
    'conversational-edit': 'nano-banana',
    'img2img': 'flux-dev',
    'inpaint': 'flux-pro',
    'bg-remove': 'bg-remover',
    'upscale': 'real-esrgan',
    'i2v': 'i2v-gen',
    'tts': 'xtts-v2',
    'svg': 'recraft-svg'
  };
  
  return defaults[mode] || models[0];
}

/**
 * Resolve model string to Replicate model format
 */
export function resolveModelString(modelKeyOrString: string): string {
  if (modelKeyOrString in MODELS) {
    return MODELS[modelKeyOrString as ModelKey].model;
  }
  
  // If it's already a replicate model string, return as-is
  if (modelKeyOrString.includes('/') && modelKeyOrString.includes(':')) {
    return modelKeyOrString;
  }
  
  // Fallback to flux-pro for unknown models
  return MODELS['flux-pro'].model;
}