import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Nano Banana - Natural language editing with mask support
export const nanoBananaAdapter: ImageEditAdapter = {
  key: "replicate.nano-banana",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    // Import prompt enhancer dynamically
    const { enhanceGeminiNanoPrompt } = await import('@/lib/geminiNanoPromptEnhancer');
    
    // Enhanced prompt processing with mode awareness
    const mode = params.mode || 'smart-inpaint';
    const baseInstruction = params.instruction || 'Edit this image intelligently';
    
    // Generate enhanced prompt using the advanced enhancer  
    const enhancedPrompt = enhanceGeminiNanoPrompt({
      userPrompt: baseInstruction,
      mode: mode as any,
      context: !!params.maskPngDataUrl ? 'masked-editing' : 'global-editing'
    });

    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'nano-banana-edit',
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl, // Pass mask for context-aware editing
          enhanced_prompt: enhancedPrompt,
          instruction: baseInstruction, // Keep original as fallback
          mode: mode,
          negative_prompt: "artifacts, distortion, low quality, unnatural blending, poor composition",
          guidance_scale: params.guidance_scale || 10.5,
          num_inference_steps: params.num_inference_steps || 40,
          strength: params.strength || 0.88
        }
      }
    });

    if (error) {
      throw new Error(`Enhanced Nano Banana edit failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from Enhanced Nano Banana edit');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Enhanced Nano Banana: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        instruction: baseInstruction,
        enhancedPrompt,
        mode,
        originalAsset: asset.id,
        provider: 'replicate.nano-banana'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// FLUX Inpaint - Precision masked editing
export const fluxInpaintAdapter: ImageEditAdapter = {
  key: "replicate.flux-inpaint",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'flux-inpaint',
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl,
          prompt: params.instruction || 'Improve this area',
          strength: 0.85,
          num_inference_steps: 28,
          guidance_scale: 7.5
        }
      }
    });

    if (error) {
      throw new Error(`FLUX Inpaint failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from FLUX Inpaint');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `FLUX Inpaint: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        instruction: params.instruction,
        originalAsset: asset.id,
        provider: 'replicate.flux-inpaint'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Professional Upscaler
export const professionalUpscalerAdapter: ImageEditAdapter = {
  key: "replicate.professional-upscaler",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const scale = (params as any).scale || 4;
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'professional-upscale',
        input: {
          image: asset.src,
          scale: scale,
          face_enhance: true,
          tile: 512
        }
      }
    });

    if (error) {
      throw new Error(`Professional upscaler failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from professional upscaler');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${scale}x Upscaled: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        scale: scale,
        originalAsset: asset.id,
        provider: 'replicate.professional-upscaler',
        width: (asset.meta?.width || 512) * scale,
        height: (asset.meta?.height || 512) * scale
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Advanced Object Remover
export const advancedObjectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.advanced-object-remover",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'advanced-object-removal',
        input: {
          image: asset.src,
          mask: params.maskPngDataUrl,
          algorithm: 'lama-cleaner',
          hd_strategy: 'Resize',
          hd_strategy_resize_limit: 2048
        }
      }
    });

    if (error) {
      throw new Error(`Advanced object removal failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from object removal');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Object Removed: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        originalAsset: asset.id,
        provider: 'replicate.advanced-object-remover'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Color Enhancement
export const colorEnhancementAdapter: ImageEditAdapter = {
  key: "replicate.color-enhancement",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'color-enhancement',
        input: {
          image: asset.src,
          brightness: (params as any).brightness || 0,
          contrast: (params as any).contrast || 0,
          saturation: (params as any).saturation || 0,
          warmth: (params as any).warmth || 0
        }
      }
    });

    if (error) {
      throw new Error(`Color enhancement failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from color enhancement');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Enhanced: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        originalAsset: asset.id,
        provider: 'replicate.color-enhancement'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Pose Adjustment
export const poseAdjustmentAdapter: ImageEditAdapter = {
  key: "replicate.pose-adjustment",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'pose-adjustment',
        input: {
          image: asset.src,
          pose_keypoints: (params as any).poseKeypoints || [],
          instruction: params.instruction || 'Adjust the pose naturally'
        }
      }
    });

    if (error) {
      throw new Error(`Pose adjustment failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from pose adjustment');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Pose Adjusted: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        originalAsset: asset.id,
        provider: 'replicate.pose-adjustment'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Face Enhancement
export const faceEnhancementAdapter: ImageEditAdapter = {
  key: "replicate.face-enhancement",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'face-enhancement',
        input: {
          image: asset.src,
          enhance_background: false,
          face_upsample: true,
          background_enhance: false,
          codeformer_fidelity: 0.8
        }
      }
    });

    if (error) {
      throw new Error(`Face enhancement failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from face enhancement');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Face Enhanced: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        originalAsset: asset.id,
        provider: 'replicate.face-enhancement'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};

// Style Transfer
export const styleTransferAdapter: ImageEditAdapter = {
  key: "replicate.style-transfer",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'style-transfer',
        input: {
          content_image: asset.src,
          style_prompt: params.instruction || 'oil painting style',
          content_strength: 0.7,
          style_strength: 0.8,
          num_inference_steps: 20
        }
      }
    });

    if (error) {
      throw new Error(`Style transfer failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from style transfer');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Style Transfer: ${asset.name}`,
      src: data.output,
      meta: { 
        ...asset.meta,
        instruction: params.instruction,
        originalAsset: asset.id,
        provider: 'replicate.style-transfer'
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
  }
};