/**
 * Copy-paste prompt recipes that "just work"
 * Optimized prompts and parameters for common editing operations
 */

import { InpaintMode } from '@/constants/models';

export interface PromptRecipe {
  title: string;
  mode: InpaintMode;
  prompt: string;
  negativePrompt: string;
  params: {
    guidance: number;
    steps: number;
    strength: number;
  };
  description: string;
}

export const PROMPT_RECIPES: PromptRecipe[] = [
  // Replace operations
  {
    title: "Dog → Cat",
    mode: "replace",
    prompt: "replace the masked object with a short-haired tabby cat facing camera, natural pose. preserve scene composition and global appearance. match lighting: soft daylight. match style: photo-real. seamless integration, accurate perspective, consistent shadows, correct scale.",
    negativePrompt: "no partial transforms, no hybrids, no remnants of original, no double subjects, no distortion",
    params: { guidance: 14, steps: 42, strength: 0.90 },
    description: "Replace any animal with a realistic tabby cat"
  },
  {
    title: "Person → Different Person",
    mode: "replace", 
    prompt: "replace the masked person with a different person of similar age and build, maintaining natural pose and expression. preserve scene composition and global appearance. match lighting: existing scene lighting. match style: photorealistic. seamless integration, correct proportions.",
    negativePrompt: "no partial transforms, no face blending, no remnants of original person, no double faces, no distortion",
    params: { guidance: 16, steps: 45, strength: 0.92 },
    description: "Replace a person with a different person"
  },
  {
    title: "Car → Different Car",
    mode: "replace",
    prompt: "replace the masked vehicle with a modern sedan car, same orientation and scale. preserve scene composition and global appearance. match lighting: ambient scene lighting. match style: photorealistic. accurate shadows, correct perspective, seamless integration.",
    negativePrompt: "no partial vehicles, no mixed car parts, no remnants of original, no floating elements, no scale issues",
    params: { guidance: 15, steps: 40, strength: 0.88 },
    description: "Replace any vehicle with a modern car"
  },

  // Add operations  
  {
    title: "Add Fairy",
    mode: "add",
    prompt: "add a small luminous woodland fairy inside the masked area. preserve scene composition and global appearance. match lighting: warm sunset rim light. match style: painterly realism. seamless integration, correct scale and occlusion.",
    negativePrompt: "no unrelated objects, no floating items, no wrong scale, no wrong lighting, no color cast",
    params: { guidance: 16, steps: 48, strength: 0.90 },
    description: "Add a magical fairy to any scene"
  },
  {
    title: "Add Flowers",
    mode: "add",
    prompt: "add beautiful wildflowers and grass inside the masked area. preserve scene composition and global appearance. match lighting: natural outdoor lighting. match style: photorealistic. organic placement, natural growth patterns, correct shadows.",
    negativePrompt: "no artificial flowers, no floating plants, no wrong perspective, no unnatural colors",
    params: { guidance: 12, steps: 36, strength: 0.85 },
    description: "Add natural flowers and vegetation"
  },
  {
    title: "Add Bird",
    mode: "add",
    prompt: "add a small songbird perched naturally inside the masked area. preserve scene composition and global appearance. match lighting: existing scene lighting. match style: photorealistic. natural pose, correct proportions, realistic feathers.",
    negativePrompt: "no floating birds, no wrong scale, no unnatural poses, no cartoon style",
    params: { guidance: 14, steps: 42, strength: 0.88 },
    description: "Add a realistic bird to the scene"
  },

  // Remove operations
  {
    title: "Remove Object",
    mode: "remove", 
    prompt: "remove the masked objects and reconstruct the background naturally.",
    negativePrompt: "no artifacts, no remnants, no fragments, no seams, no repeats, no smudges",
    params: { guidance: 20, steps: 52, strength: 0.96 },
    description: "Clean removal of any object"
  },
  {
    title: "Remove Person",
    mode: "remove",
    prompt: "remove the masked person completely and fill the area with appropriate background content, maintaining natural perspective and lighting.",
    negativePrompt: "no ghost outlines, no person remnants, no body parts, no artifacts, no unnatural patches",
    params: { guidance: 22, steps: 56, strength: 0.98 },
    description: "Remove a person from the scene"
  },
  {
    title: "Remove Text/Watermark",
    mode: "remove",
    prompt: "remove all text, logos, and watermarks from the masked area and restore the original background seamlessly.",
    negativePrompt: "no text fragments, no logo remnants, no color bleeding, no artifacts, no visible patches",
    params: { guidance: 18, steps: 48, strength: 0.94 },
    description: "Clean removal of text and watermarks"
  }
];

/**
 * Get recipes filtered by mode
 */
export function getRecipesByMode(mode: InpaintMode): PromptRecipe[] {
  return PROMPT_RECIPES.filter(recipe => recipe.mode === mode);
}

/**
 * Get a specific recipe by title
 */
export function getRecipeByTitle(title: string): PromptRecipe | undefined {
  return PROMPT_RECIPES.find(recipe => recipe.title === title);
}

/**
 * Get recommended parameters for quality level and mode
 */
export function getRecommendedParams(mode: InpaintMode, quality: 'fast' | 'balanced' | 'high' | 'ultra') {
  const baseParams = {
    replace: { guidance: [12, 16], steps: [36, 48], strength: [0.88, 0.94] },
    add: { guidance: [14, 18], steps: [40, 50], strength: [0.86, 0.92] },
    remove: { guidance: [18, 22], steps: [44, 56], strength: [0.94, 0.98] }
  };

  const qualityMultipliers = {
    fast: 0.7,
    balanced: 1.0, 
    high: 1.3,
    ultra: 1.6
  };

  const base = baseParams[mode];
  const multiplier = qualityMultipliers[quality];

  return {
    guidance: Math.round((base.guidance[0] + base.guidance[1]) / 2 * multiplier),
    steps: Math.round((base.steps[0] + base.steps[1]) / 2 * multiplier),
    strength: Math.min(0.98, (base.strength[0] + base.strength[1]) / 2 * multiplier)
  };
}