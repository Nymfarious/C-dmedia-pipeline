interface GeminiNanoPromptOptions {
  mode: 'remove' | 'add' | 'replace' | 'enhance' | 'style';
  userPrompt: string;
  context?: string;
  operation?: string;
  imageAnalysis?: {
    dominantColors?: string[];
    lighting?: 'bright' | 'dim' | 'natural' | 'artificial';
    style?: 'realistic' | 'artistic' | 'cartoon' | 'photography';
    objects?: string[];
    scene?: string;
  };
}

interface EnhancedGeminiPrompt {
  prompt: string;
  negativePrompt: string;
  guidance_scale: number;
  strength: number;
  num_inference_steps: number;
}

export function enhanceGeminiNanoPrompt(options: GeminiNanoPromptOptions): EnhancedGeminiPrompt {
  const { mode, userPrompt, context, imageAnalysis } = options;
  
  console.log('Enhancing Gemini Nano prompt:', { mode, userPrompt, context });

  switch (mode) {
    case 'remove':
      return enhanceRemovalPrompt(userPrompt, imageAnalysis);
    case 'add':
      return enhanceAdditionPrompt(userPrompt, context, imageAnalysis);
    case 'replace':
      return enhanceReplacementPrompt(userPrompt, context, imageAnalysis);
    case 'enhance':
      return enhanceEnhancementPrompt(userPrompt, imageAnalysis);
    case 'style':
      return enhanceStylePrompt(userPrompt, imageAnalysis);
    default:
      return enhanceGeneralPrompt(userPrompt, imageAnalysis);
  }
}

function enhanceRemovalPrompt(prompt: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const enhanced = `Remove ${prompt} from the image completely. Seamlessly fill the empty space with background that matches the surrounding area. Maintain consistent ${analysis?.lighting || 'natural'} lighting, perspective, and ${analysis?.style || 'realistic'} style. Ensure no traces or artifacts remain. The result should look natural and unedited.`;

  return {
    prompt: enhanced,
    negativePrompt: "artifacts, seams, obvious editing, inconsistent lighting, blurred edges, distortion, low quality, visible removal marks, unnatural transitions",
    guidance_scale: 12.0,
    strength: 0.95,
    num_inference_steps: 40
  };
}

function enhanceAdditionPrompt(prompt: string, context?: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const styleContext = analysis?.style ? `in ${analysis.style} style` : '';
  const lightingContext = analysis?.lighting ? `with ${analysis.lighting} lighting` : '';
  const sceneContext = context || analysis?.scene || 'the scene';
  
  const enhanced = `Add a ${prompt} to ${sceneContext} ${styleContext}. Ensure the new object matches the existing ${lightingContext}, perspective, and overall composition. The addition should blend seamlessly with the original image, maintaining consistent shadows, reflections, and depth of field. Make it look naturally placed and integrated.`;

  return {
    prompt: enhanced,
    negativePrompt: "floating objects, inconsistent lighting, mismatched perspective, artificial placement, obvious additions, poor integration, artifacts, low quality",
    guidance_scale: 10.0,
    strength: 0.85,
    num_inference_steps: 35
  };
}

function enhanceReplacementPrompt(prompt: string, context?: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const enhancedPrompt = extractObjectAndReplacement(prompt);
  const styleContext = analysis?.style ? `maintaining ${analysis.style} style` : '';
  const lightingContext = analysis?.lighting ? `preserving ${analysis.lighting} lighting` : '';
  
  const enhanced = `Replace ${enhancedPrompt.original} with ${enhancedPrompt.replacement}. ${styleContext} ${lightingContext}. Ensure the new object fits naturally in the same space, with correct size, perspective, and positioning. Match surrounding colors, shadows, and atmospheric conditions. The replacement should look like it was always part of the original image.`;

  return {
    prompt: enhanced,
    negativePrompt: "size mismatch, incorrect perspective, inconsistent style, poor blending, obvious replacement, artifacts, unnatural positioning, lighting inconsistency",
    guidance_scale: 11.0,
    strength: 0.90,
    num_inference_steps: 45
  };
}

function enhanceEnhancementPrompt(prompt: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const enhanced = `Enhance and improve ${prompt} while maintaining the original composition and style. Increase detail quality, refine textures, and improve overall visual appeal. ${analysis?.style === 'photography' ? 'Enhance as professional photography with improved clarity and color grading.' : 'Improve artistic quality and detail refinement.'}`;

  return {
    prompt: enhanced,
    negativePrompt: "over-processing, artificial enhancement, loss of natural appearance, excessive saturation, digital artifacts, unrealistic details",
    guidance_scale: 8.0,
    strength: 0.70,
    num_inference_steps: 30
  };
}

function enhanceStylePrompt(prompt: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const enhanced = `Transform the image to ${prompt} style while preserving all original subjects and composition. Maintain recognizable features and spatial relationships. Apply stylistic changes to color palette, texture, and artistic treatment without altering the core content or layout.`;

  return {
    prompt: enhanced,
    negativePrompt: "content alteration, subject changes, composition changes, unrecognizable results, poor style application, inconsistent transformation",
    guidance_scale: 9.0,
    strength: 0.75,
    num_inference_steps: 35
  };
}

function enhanceGeneralPrompt(prompt: string, analysis?: GeminiNanoPromptOptions['imageAnalysis']): EnhancedGeminiPrompt {
  const enhanced = `${prompt}. Maintain high quality, realistic proportions, and natural appearance. Ensure consistency with the original image's style and lighting conditions.`;

  return {
    prompt: enhanced,
    negativePrompt: "low quality, artifacts, unrealistic, poor composition, inconsistent style",
    guidance_scale: 8.5,
    strength: 0.80,
    num_inference_steps: 30
  };
}

function extractObjectAndReplacement(prompt: string): { original: string; replacement: string } {
  // Handle various prompt formats
  const changeToPattern = /change\s+(.+?)\s+to\s+(.+)/i;
  const replacePattern = /replace\s+(.+?)\s+with\s+(.+)/i;
  const toPattern = /(.+?)\s+to\s+(.+)/i;
  
  let match = prompt.match(changeToPattern) || prompt.match(replacePattern);
  if (match) {
    return { original: match[1].trim(), replacement: match[2].trim() };
  }
  
  match = prompt.match(toPattern);
  if (match) {
    return { original: match[1].trim(), replacement: match[2].trim() };
  }
  
  // Default fallback
  return { original: 'the selected area', replacement: prompt };
}

export function getOptimizedGeminiNanoParams(mode: 'remove' | 'add' | 'replace' | 'enhance' | 'style'): {
  guidance_scale: number;
  strength: number;
  num_inference_steps: number;
} {
  switch (mode) {
    case 'remove':
      return { guidance_scale: 12.0, strength: 0.95, num_inference_steps: 40 };
    case 'add':
      return { guidance_scale: 10.0, strength: 0.85, num_inference_steps: 35 };
    case 'replace':
      return { guidance_scale: 11.0, strength: 0.90, num_inference_steps: 45 };
    case 'enhance':
      return { guidance_scale: 8.0, strength: 0.70, num_inference_steps: 30 };
    case 'style':
      return { guidance_scale: 9.0, strength: 0.75, num_inference_steps: 35 };
    default:
      return { guidance_scale: 8.5, strength: 0.80, num_inference_steps: 30 };
  }
}