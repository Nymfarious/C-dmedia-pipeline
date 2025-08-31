import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { enhanceGeminiNanoPrompt, getOptimizedGeminiNanoParams } from '@/lib/geminiNanoPromptEnhancer';

export const geminiNanoAdapter: ImageEditAdapter = {
  key: "replicate.nano-banana",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    console.log('Nano Banana edit params:', params);
    
    let instruction = params.instruction || "Edit this image";
    let operation = params.operation || 'nano-banana-edit';
    let mode: 'remove' | 'add' | 'replace' | 'enhance' | 'style' = 'enhance';
    
    // Determine operation mode and enhance instruction
    if (params.brushMask && params.brushMask.length > 0) {
      mode = 'remove';
      instruction = params.removeObjectInstruction || instruction;
    }
    
    // Handle mask-based operations with enhanced prompting
    if (params.maskPngDataUrl && params.operation) {
      switch (params.operation) {
        case 'remove-object':
        case 'advanced-object-removal':
          operation = 'advanced-object-removal';
          mode = 'remove';
          instruction = params.removeObjectInstruction || instruction;
          break;
        case 'add-object':
          operation = 'add-object';
          mode = 'add';
          instruction = params.addObjectInstruction || instruction;
          break;
        case 'flux-inpaint':
          operation = 'flux-inpaint';
          // Determine mode from instruction
          if (instruction.toLowerCase().includes('remove') || instruction.toLowerCase().includes('delete')) {
            mode = 'remove';
          } else if (instruction.toLowerCase().includes('add') || instruction.toLowerCase().includes('insert')) {
            mode = 'add';
          } else if (instruction.toLowerCase().includes('change') || instruction.toLowerCase().includes('replace')) {
            mode = 'replace';
          }
          break;
        case 'multi-image-fusion':
          operation = 'nano-banana-edit';
          mode = 'enhance';
          instruction = `Combine and blend these images: ${instruction}`;
          break;
      }
    }
    
    if (params.colorAdjustments) {
      const adjustments = [];
      if (params.colorAdjustments.brightness !== undefined && params.colorAdjustments.brightness !== 0) {
        adjustments.push(`adjust brightness by ${params.colorAdjustments.brightness > 0 ? '+' : ''}${params.colorAdjustments.brightness}%`);
      }
      if (params.colorAdjustments.contrast !== undefined && params.colorAdjustments.contrast !== 0) {
        adjustments.push(`adjust contrast by ${params.colorAdjustments.contrast > 0 ? '+' : ''}${params.colorAdjustments.contrast}%`);
      }
      if (params.colorAdjustments.saturation !== undefined && params.colorAdjustments.saturation !== 0) {
        adjustments.push(`adjust saturation by ${params.colorAdjustments.saturation > 0 ? '+' : ''}${params.colorAdjustments.saturation}%`);
      }
      if (params.colorAdjustments.warmth !== undefined && params.colorAdjustments.warmth !== 0) {
        adjustments.push(`adjust warmth by ${params.colorAdjustments.warmth > 0 ? '+' : ''}${params.colorAdjustments.warmth}%`);
      }
      if (adjustments.length > 0) {
        instruction = adjustments.join(', ') + '. ' + instruction;
      }
    }
    
    if (params.stylePreset) {
      instruction = `Apply ${params.stylePreset} style filter. ${instruction}`;
    }
    
    if (params.cropSettings) {
      instruction = `Crop and recompose the image for ${params.cropSettings.aspectRatio} aspect ratio with ${params.cropSettings.preset} composition. ${instruction}`;
    }
    
    if (params.poseAdjustments) {
      instruction = `Adjust the pose according to the keypoint modifications. ${instruction}`;
      mode = 'enhance';
    }

    // Enhanced prompt processing with Gemini Nano optimization
    const promptOptions = {
      mode,
      userPrompt: instruction,
      context: asset.meta?.originalPrompt,
      operation: params.operation,
      complexity: (params.complexity as 'simple' | 'moderate' | 'complex' | 'ultra-complex') || 'moderate',
      targetQuality: (params.targetQuality as 'standard' | 'high' | 'ultra' | 'professional') || 'high',
      preserveContext: params.preserveContext !== false,
      imageAnalysis: {
        lighting: 'natural' as const,
        style: 'realistic' as const,
        scene: asset.meta?.originalPrompt ? `scene from: ${asset.meta.originalPrompt}` : 'the image',
        mood: 'calm' as const
      }
    };

    const enhancedPrompt = enhanceGeminiNanoPrompt(promptOptions);
    console.log('🎯 Enhanced prompt result:', {
      original: instruction,
      enhanced: enhancedPrompt.prompt.substring(0, 100) + '...',
      mode,
      parameters: {
        guidance_scale: enhancedPrompt.guidance_scale,
        strength: enhancedPrompt.strength,
        steps: enhancedPrompt.num_inference_steps
      }
    });

    // Prepare input for enhanced replicate function with optimized parameters
    const input: any = {
      image: asset.src,
      enhanced_prompt: enhancedPrompt.prompt,
      prompt: enhancedPrompt.fallbackPrompt || enhancedPrompt.prompt,
      negative_prompt: enhancedPrompt.negativePrompt,
      guidance_scale: params.guidance_scale || enhancedPrompt.guidance_scale,
      num_inference_steps: params.num_inference_steps || enhancedPrompt.num_inference_steps,
      strength: params.strength || enhancedPrompt.strength,
      mode: mode,
      complexity: params.complexity,
      targetQuality: params.targetQuality
    };

    // Add mask if provided
    if (params.maskPngDataUrl) {
      input.mask = params.maskPngDataUrl;
    }

    // Add multi-image support
    if (params.multiImageUrls && params.multiImageUrls.length > 1) {
      input.images = params.multiImageUrls;
      input.composition_style = params.compositionStyle || 'seamless blend';
    }

    console.log('🚀 Calling Enhanced Gemini Nano:', { 
      operation, 
      mode, 
      originalInstruction: instruction,
      enhancedPrompt: enhancedPrompt.prompt.substring(0, 150) + '...',
      complexity: params.complexity,
      quality: params.targetQuality,
      parameters: {
        guidance_scale: enhancedPrompt.guidance_scale,
        strength: enhancedPrompt.strength,
        steps: enhancedPrompt.num_inference_steps
      }
    });

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation,
        input
      }
    });

    if (error) {
      console.error('Nano Banana editing error:', error);
      throw new Error(`Nano Banana editing failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No edited image received from Nano Banana');
    }

    // Create new asset with edited image
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (${operation === 'multi-image-fusion' ? 'Combined' : 'Edited'} by Nano Banana)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.nano-banana',
        model: 'google/nano-banana',
        originalAsset: asset.id,
        editType: operation,
        editMode: mode,
        originalInstruction: instruction,
        enhancedPrompt: enhancedPrompt.prompt,
        fallbackPrompt: enhancedPrompt.fallbackPrompt,
        contextualHints: enhancedPrompt.contextualHints,
        qualityModifiers: enhancedPrompt.qualityModifiers,
        complexity: params.complexity,
        targetQuality: params.targetQuality,
        parameters: {
          guidance_scale: enhancedPrompt.guidance_scale,
          strength: enhancedPrompt.strength,
          steps: enhancedPrompt.num_inference_steps
        },
        editedAt: Date.now()
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: params.operation === 'multi-image-fusion' ? 'AI Combined' : 'AI Enhanced'
    };

    return newAsset;
  }
};