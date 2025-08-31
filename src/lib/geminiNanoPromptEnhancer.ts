interface ImageAnalysis {
  dominantColors?: string[];
  lighting?: 'bright' | 'dim' | 'natural' | 'artificial' | 'studio' | 'golden' | 'blue';
  style?: 'realistic' | 'artistic' | 'cartoon' | 'photography' | 'painting' | 'sketch' | 'digital';
  objects?: string[];
  scene?: string;
  composition?: 'portrait' | 'landscape' | 'close-up' | 'wide-shot' | 'macro';
  texture?: 'smooth' | 'rough' | 'soft' | 'metallic' | 'fabric' | 'natural';
  mood?: 'cheerful' | 'dramatic' | 'calm' | 'energetic' | 'mysterious' | 'warm' | 'cool';
}

interface GeminiNanoPromptOptions {
  mode: 'precision-replace' | 'style-transfer' | 'smart-inpaint' | 'detail-enhance' | 'remove' | 'add' | 'replace' | 'enhance' | 'style';
  userPrompt: string;
  context?: string;
  operation?: string;
  imageAnalysis?: ImageAnalysis;
  complexity?: 'simple' | 'moderate' | 'complex' | 'ultra-complex';
  preserveContext?: boolean;
  targetQuality?: 'standard' | 'high' | 'ultra' | 'professional';
}

interface EnhancedGeminiPrompt {
  prompt: string;
  negativePrompt: string;
  guidance_scale: number;
  strength: number;
  num_inference_steps: number;
  fallbackPrompt?: string;
  contextualHints?: string[];
  qualityModifiers?: string[];
  preservationInstructions?: string[];
}

// Advanced image analysis and context detection
function analyzeImageContext(userPrompt: string, existingAnalysis?: ImageAnalysis): ImageAnalysis {
  const prompt = userPrompt.toLowerCase();
  
  // Detect scene context
  let scene = existingAnalysis?.scene || 'general scene';
  if (prompt.includes('portrait') || prompt.includes('face') || prompt.includes('person')) scene = 'portrait photography';
  if (prompt.includes('landscape') || prompt.includes('nature') || prompt.includes('outdoor')) scene = 'landscape scene';
  if (prompt.includes('studio') || prompt.includes('professional')) scene = 'studio setting';
  if (prompt.includes('street') || prompt.includes('urban')) scene = 'urban environment';
  if (prompt.includes('indoor') || prompt.includes('room') || prompt.includes('interior')) scene = 'interior space';
  
  // Detect style
  let style = existingAnalysis?.style || 'realistic';
  if (prompt.includes('painting') || prompt.includes('artistic')) style = 'artistic';
  if (prompt.includes('photo') || prompt.includes('realistic')) style = 'photography';
  if (prompt.includes('cartoon') || prompt.includes('animated')) style = 'cartoon';
  if (prompt.includes('sketch') || prompt.includes('drawing')) style = 'sketch';
  
  // Detect lighting
  let lighting = existingAnalysis?.lighting || 'natural';
  if (prompt.includes('studio') || prompt.includes('professional')) lighting = 'studio';
  if (prompt.includes('golden') || prompt.includes('sunset') || prompt.includes('warm')) lighting = 'golden';
  if (prompt.includes('cool') || prompt.includes('blue') || prompt.includes('moonlight')) lighting = 'blue';
  if (prompt.includes('bright') || prompt.includes('sunny')) lighting = 'bright';
  if (prompt.includes('dim') || prompt.includes('dark') || prompt.includes('shadow')) lighting = 'dim';
  
  return {
    ...existingAnalysis,
    scene,
    style,
    lighting,
    mood: existingAnalysis?.mood || 'calm'
  };
}

function buildContextualPrompt(basePrompt: string, analysis: ImageAnalysis, qualityLevel: string = 'high'): string {
  const contextualElements = [];
  
  // Add style consistency
  if (analysis.style) {
    contextualElements.push(`maintaining ${analysis.style} style consistency`);
  }
  
  // Add lighting preservation
  if (analysis.lighting) {
    contextualElements.push(`preserving ${analysis.lighting} lighting conditions`);
  }
  
  // Add scene context
  if (analysis.scene) {
    contextualElements.push(`appropriate for ${analysis.scene}`);
  }
  
  // Add quality modifiers
  const qualityModifiers = qualityLevel === 'ultra' 
    ? ['ultra-high detail', 'professional quality', 'photorealistic rendering']
    : qualityLevel === 'high'
    ? ['high detail', 'sharp focus', 'natural rendering']
    : ['good quality', 'clear details'];
  
  return `${basePrompt}, ${contextualElements.join(', ')}, ${qualityModifiers.join(', ')}`;
}

export function enhanceGeminiNanoPrompt(options: GeminiNanoPromptOptions): EnhancedGeminiPrompt {
  const { mode, userPrompt, context, imageAnalysis, complexity = 'moderate', targetQuality = 'high' } = options;
  
  console.log('🎯 Advanced Gemini Nano prompt enhancement:', { mode, userPrompt, context, complexity, targetQuality });

  // Analyze image context for better prompting
  const enhancedAnalysis = analyzeImageContext(userPrompt, imageAnalysis);
  
  switch (mode) {
    case 'precision-replace':
      return enhancePrecisionReplacePrompt(userPrompt, context, enhancedAnalysis, targetQuality);
    case 'style-transfer':
      return enhanceStyleTransferPrompt(userPrompt, enhancedAnalysis, targetQuality);
    case 'smart-inpaint':
      return enhanceSmartInpaintPrompt(userPrompt, enhancedAnalysis, complexity, targetQuality);
    case 'detail-enhance':
      return enhanceDetailEnhancementPrompt(userPrompt, enhancedAnalysis, targetQuality);
    case 'remove':
      return enhanceRemovalPrompt(userPrompt, enhancedAnalysis, targetQuality);
    case 'add':
      return enhanceAdditionPrompt(userPrompt, context, enhancedAnalysis, targetQuality);
    case 'replace':
      return enhanceReplacementPrompt(userPrompt, context, enhancedAnalysis, targetQuality);
    case 'enhance':
      return enhanceEnhancementPrompt(userPrompt, enhancedAnalysis, targetQuality);
    case 'style':
      return enhanceStylePrompt(userPrompt, enhancedAnalysis, targetQuality);
    default:
      return enhanceGeneralPrompt(userPrompt, enhancedAnalysis, targetQuality);
  }
}

// Enhanced mode-specific prompt functions
function enhancePrecisionReplacePrompt(prompt: string, context?: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const replacement = extractObjectAndReplacement(prompt);
  const basePrompt = `Precisely replace ${replacement.original} with ${replacement.replacement}`;
  const enhanced = buildContextualPrompt(basePrompt, analysis || {}, quality);
  
  const contextualHints = [
    'exact size and positioning match',
    'seamless integration with environment',
    'natural depth and perspective',
    'proper shadow casting and light interaction'
  ];
  
  const qualityModifiers = quality === 'ultra' 
    ? ['photorealistic quality', 'professional precision', 'flawless execution']
    : ['high quality', 'natural appearance', 'clean execution'];

  return {
    prompt: `${enhanced}. ${contextualHints.join(', ')}, ${qualityModifiers.join(', ')}`,
    negativePrompt: "size mismatch, floating objects, incorrect perspective, poor integration, visible seams, artifacts, unnatural placement, lighting inconsistency, distortion",
    guidance_scale: 11.5,
    strength: 0.92,
    num_inference_steps: 45,
    fallbackPrompt: `Replace ${replacement.original} with ${replacement.replacement} maintaining scene consistency`,
    contextualHints,
    qualityModifiers,
    preservationInstructions: ['preserve lighting', 'maintain perspective', 'keep scene composition']
  };
}

function enhanceStyleTransferPrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const basePrompt = `Transform to ${prompt} style while preserving all original content and composition`;
  const enhanced = buildContextualPrompt(basePrompt, analysis || {}, quality);
  
  return {
    prompt: `${enhanced}. Maintain subject recognition, preserve spatial relationships, apply consistent style transformation`,
    negativePrompt: "content alteration, subject loss, composition changes, inconsistent style application, artifacts, distortion",
    guidance_scale: 9.5,
    strength: 0.78,
    num_inference_steps: 38,
    fallbackPrompt: `Apply ${prompt} style filter while keeping original subjects intact`,
    contextualHints: ['preserve subject identity', 'maintain composition'],
    qualityModifiers: ['consistent style', 'smooth transformation']
  };
}

function enhanceSmartInpaintPrompt(prompt: string, analysis?: ImageAnalysis, complexity: string = 'moderate', quality: string = 'high'): EnhancedGeminiPrompt {
  const basePrompt = `Intelligently inpaint: ${prompt}`;
  const enhanced = buildContextualPrompt(basePrompt, analysis || {}, quality);
  
  // Adjust parameters based on complexity
  const params = complexity === 'ultra-complex' 
    ? { guidance_scale: 12.5, strength: 0.95, steps: 50 }
    : complexity === 'complex'
    ? { guidance_scale: 11.0, strength: 0.88, steps: 42 }
    : complexity === 'simple'
    ? { guidance_scale: 9.0, strength: 0.75, steps: 30 }
    : { guidance_scale: 10.0, strength: 0.82, steps: 35 };

  return {
    prompt: `${enhanced}. Smart integration with surroundings, natural blending, contextual awareness`,
    negativePrompt: "obvious inpainting, visible seams, inconsistent textures, poor blending, artifacts, unnatural integration",
    guidance_scale: params.guidance_scale,
    strength: params.strength,
    num_inference_steps: params.steps,
    fallbackPrompt: `Seamlessly blend ${prompt} into the existing scene`,
    contextualHints: ['contextual integration', 'natural blending'],
    qualityModifiers: ['seamless result', 'intelligent filling']
  };
}

function enhanceDetailEnhancementPrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const basePrompt = `Enhance details and quality of ${prompt}`;
  const enhanced = buildContextualPrompt(basePrompt, analysis || {}, quality);
  
  return {
    prompt: `${enhanced}. Increase sharpness, refine textures, improve clarity while preserving original character`,
    negativePrompt: "over-processing, artificial enhancement, loss of natural appearance, excessive saturation, digital artifacts, unrealistic details",
    guidance_scale: 8.5,
    strength: 0.68,
    num_inference_steps: 32,
    fallbackPrompt: `Improve quality and detail of ${prompt} naturally`,
    contextualHints: ['preserve character', 'natural enhancement'],
    qualityModifiers: ['refined details', 'improved clarity']
  };
}

function enhanceRemovalPrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const basePrompt = `Remove ${prompt} completely and seamlessly fill the area`;
  const enhanced = buildContextualPrompt(basePrompt, analysis || {}, quality);

  return {
    prompt: `${enhanced}. Intelligent background reconstruction, perfect edge blending, natural result`,
    negativePrompt: "artifacts, seams, obvious editing, inconsistent lighting, blurred edges, distortion, low quality, visible removal marks, unnatural transitions, incomplete removal",
    guidance_scale: 12.0,
    strength: 0.95,
    num_inference_steps: 42,
    fallbackPrompt: `Cleanly remove ${prompt} and fill with appropriate background`,
    contextualHints: ['seamless removal', 'background reconstruction'],
    qualityModifiers: ['natural result', 'perfect blending']
  };
}

function enhanceAdditionPrompt(prompt: string, context?: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
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

function enhanceReplacementPrompt(prompt: string, context?: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
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

function enhanceEnhancementPrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const enhanced = `Enhance and improve ${prompt} while maintaining the original composition and style. Increase detail quality, refine textures, and improve overall visual appeal. ${analysis?.style === 'photography' ? 'Enhance as professional photography with improved clarity and color grading.' : 'Improve artistic quality and detail refinement.'}`;

  return {
    prompt: enhanced,
    negativePrompt: "over-processing, artificial enhancement, loss of natural appearance, excessive saturation, digital artifacts, unrealistic details",
    guidance_scale: 8.0,
    strength: 0.70,
    num_inference_steps: 30
  };
}

function enhanceStylePrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
  const enhanced = `Transform the image to ${prompt} style while preserving all original subjects and composition. Maintain recognizable features and spatial relationships. Apply stylistic changes to color palette, texture, and artistic treatment without altering the core content or layout.`;

  return {
    prompt: enhanced,
    negativePrompt: "content alteration, subject changes, composition changes, unrecognizable results, poor style application, inconsistent transformation",
    guidance_scale: 9.0,
    strength: 0.75,
    num_inference_steps: 35
  };
}

function enhanceGeneralPrompt(prompt: string, analysis?: ImageAnalysis, quality: string = 'high'): EnhancedGeminiPrompt {
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