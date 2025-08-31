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
 * Get optimized parameters for different inpainting operations
 */
export function getOptimizedInpaintingParams(mode: 'remove' | 'add' | 'replace') {
  switch (mode) {
    case 'remove':
      return {
        guidance_scale: 15.0,
        strength: 0.95,
        num_inference_steps: 45
      };
    case 'add':
      return {
        guidance_scale: 12.0,
        strength: 0.85,
        num_inference_steps: 40
      };
    case 'replace':
      return {
        guidance_scale: 14.0,
        strength: 0.90,
        num_inference_steps: 42
      };
    default:
      return {
        guidance_scale: 12.0,
        strength: 0.85,
        num_inference_steps: 35
      };
  }
}