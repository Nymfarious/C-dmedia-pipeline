/**
 * Enhanced prompt processing for inpainting operations
 * Converts simple user prompts into detailed, effective prompts for AI models
 */

export interface PromptEnhancementOptions {
  mode: 'remove' | 'add' | 'replace';
  userPrompt: string;
  context?: string;
}

export interface EnhancedPrompt {
  prompt: string;
  negativePrompt: string;
}

/**
 * Enhance user prompts for better inpainting results
 */
export function enhanceInpaintingPrompt(options: PromptEnhancementOptions): EnhancedPrompt {
  const { mode, userPrompt, context } = options;
  
  // Clean and normalize user input
  const cleanPrompt = userPrompt.trim().toLowerCase();
  
  let enhancedPrompt: string;
  let negativePrompt: string;
  
  switch (mode) {
    case 'remove':
      enhancedPrompt = enhanceRemovalPrompt(cleanPrompt);
      negativePrompt = "artifacts, remnants, traces, scars, marks, distortion, blur, incomplete removal, leftover parts, inconsistent lighting, unnatural shadows";
      break;
      
    case 'add':
      enhancedPrompt = enhanceAdditionPrompt(cleanPrompt, context);
      negativePrompt = "poor integration, mismatched lighting, inconsistent perspective, floating objects, unnatural placement, artifacts, blur, distortion";
      break;
      
    case 'replace':
      enhancedPrompt = enhanceReplacementPrompt(cleanPrompt, context);
      negativePrompt = "poor replacement, mismatched style, inconsistent lighting, unnatural perspective, artifacts, blur, distortion, remnants of original";
      break;
      
    default:
      enhancedPrompt = cleanPrompt;
      negativePrompt = "artifacts, blur, distortion, poor quality";
  }
  
  return {
    prompt: enhancedPrompt,
    negativePrompt
  };
}

function enhanceRemovalPrompt(prompt: string): string {
  if (!prompt || prompt === 'remove' || prompt === '') {
    return "completely remove the painted objects, seamlessly fill the area with appropriate background content, maintain natural lighting and perspective";
  }
  
  // Add enhancement prefixes/suffixes for removal
  const enhancements = [
    "completely remove",
    "seamlessly fill the empty space",
    "maintain natural lighting and shadows",
    "preserve the original background style",
    "ensure smooth blending with surroundings"
  ];
  
  return `${prompt}, ${enhancements.join(', ')}`;
}

function enhanceAdditionPrompt(prompt: string, context?: string): string {
  if (!prompt || prompt === 'add' || prompt === '') {
    return "add a realistic object that fits naturally in the scene, matching the lighting, perspective, and style of the original image";
  }
  
  // Extract object to add
  const objectMatch = prompt.match(/(?:add|place|put|insert)\s+(?:a\s+)?(.+)/);
  const objectToAdd = objectMatch ? objectMatch[1] : prompt;
  
  // Enhanced prompt with context-aware additions
  const basePrompt = `add a realistic ${objectToAdd}`;
  const enhancements = [
    "that fits naturally in the scene",
    "matching the lighting and shadows of the original image", 
    "with correct perspective and scale",
    "seamlessly integrated into the environment",
    context ? `consistent with the ${context} setting` : "appropriate for the scene"
  ];
  
  return `${basePrompt} ${enhancements.join(', ')}`;
}

function enhanceReplacementPrompt(prompt: string, context?: string): string {
  if (!prompt || prompt === 'replace' || prompt === '') {
    return "replace the painted objects with something new that fits naturally in the scene, maintaining proper lighting, perspective, and style";
  }
  
  // Extract replacement target
  const replaceMatch = prompt.match(/(?:replace|change|turn|convert).+?(?:with|to|into)\s+(.+)/);
  const changeMatch = prompt.match(/change\s+to\s+(.+)/);
  const replacementObject = replaceMatch ? replaceMatch[1] : changeMatch ? changeMatch[1] : prompt;
  
  // Enhanced prompt for replacement
  const basePrompt = `replace the painted objects with a realistic ${replacementObject}`;
  const enhancements = [
    "maintaining the same scale and position",
    "matching the lighting and shadows of the original scene",
    "with proper perspective and natural integration",
    "seamlessly blended into the environment",
    context ? `appropriate for the ${context} setting` : "fitting the scene naturally"
  ];
  
  return `${basePrompt}, ${enhancements.join(', ')}`;
}

/**
 * Get optimized parameters for different inpainting operations and quality levels
 */
export function getOptimizedInpaintingParams(
  mode: 'remove' | 'add' | 'replace',
  qualityLevel: 'fast' | 'balanced' | 'quality' | 'ultra' = 'balanced'
) {
  const baseParams = {
    'remove': {
      guidance_scale: 15.0,
      strength: 0.95,
      num_inference_steps: 45
    },
    'add': {
      guidance_scale: 12.0,
      strength: 0.85,
      num_inference_steps: 40
    },
    'replace': {
      guidance_scale: 14.0,
      strength: 0.90,
      num_inference_steps: 42
    }
  };

  const qualityMultipliers = {
    'fast': { guidance_scale: 0.7, strength: 0.9, num_inference_steps: 0.5 },
    'balanced': { guidance_scale: 1.0, strength: 1.0, num_inference_steps: 1.0 },
    'quality': { guidance_scale: 1.2, strength: 1.05, num_inference_steps: 1.4 },
    'ultra': { guidance_scale: 1.4, strength: 1.1, num_inference_steps: 1.8 }
  };

  const base = baseParams[mode] || baseParams['add'];
  const multiplier = qualityMultipliers[qualityLevel];

  return {
    guidance_scale: Math.round(base.guidance_scale * multiplier.guidance_scale * 10) / 10,
    strength: Math.round(base.strength * multiplier.strength * 100) / 100,
    num_inference_steps: Math.max(10, Math.round(base.num_inference_steps * multiplier.num_inference_steps))
  };
}

/**
 * Convert UI slider values to parameter values
 */
export function convertUIToParams(qualityVsSpeed: number, precisionVsCreativity: number): {
  qualityLevel: 'fast' | 'balanced' | 'quality' | 'ultra';
  precisionMultiplier: number;
} {
  // Quality vs Speed (0-100) -> Quality Level
  const qualityLevel: 'fast' | 'balanced' | 'quality' | 'ultra' = 
    qualityVsSpeed <= 25 ? 'fast' :
    qualityVsSpeed <= 50 ? 'balanced' :
    qualityVsSpeed <= 75 ? 'quality' : 'ultra';

  // Precision vs Creativity affects guidance scale
  const precisionMultiplier = 0.5 + (precisionVsCreativity / 100); // 0.5 to 1.5

  return { qualityLevel, precisionMultiplier };
}

/**
 * Enhanced negative prompts for different modes
 */
export function getEnhancedNegativePrompt(mode: 'remove' | 'add' | 'replace'): string {
  const commonNegatives = "artifacts, blur, distortion, poor quality, watermark, text";
  
  const modeSpecific = {
    'remove': "remnants, traces, leftover parts, duplicate shapes, hallucinations, incomplete removal, object fragments, unnatural patches, visible seams, scars, marks",
    'add': "poor integration, mismatched lighting, inconsistent perspective, floating objects, unnatural placement, wrong scale, lighting mismatch, shadow inconsistency",
    'replace': "partial transformation, mixed objects, incomplete change, original remnants, hybrid artifacts, poor replacement, mismatched style, inconsistent integration"
  };

  return `${commonNegatives}, ${modeSpecific[mode]}`;
}