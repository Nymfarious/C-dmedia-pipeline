import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const colorEnhancerAdapter: ImageEditAdapter = {
  key: "replicate.color-enhance",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.colorAdjustments && !params.stylePreset) {
      throw new Error('Color adjustments or style preset required');
    }

    let instruction = '';
    
    if (params.colorAdjustments) {
      const { brightness, contrast, saturation, warmth } = params.colorAdjustments;
      const adjustments = [];
      
      if (brightness && brightness !== 0) {
        adjustments.push(brightness > 0 ? `increase brightness by ${brightness}%` : `decrease brightness by ${Math.abs(brightness)}%`);
      }
      if (contrast && contrast !== 0) {
        adjustments.push(contrast > 0 ? `increase contrast by ${contrast}%` : `decrease contrast by ${Math.abs(contrast)}%`);
      }
      if (saturation && saturation !== 0) {
        adjustments.push(saturation > 0 ? `increase saturation by ${saturation}%` : `decrease saturation by ${Math.abs(saturation)}%`);
      }
      if (warmth && warmth !== 0) {
        adjustments.push(warmth > 0 ? `make warmer by ${warmth}%` : `make cooler by ${Math.abs(warmth)}%`);
      }
      
      instruction = adjustments.join(', ');
    }

    if (params.stylePreset) {
      const styleInstructions = {
        'film': 'apply vintage film look with grain and warm tones',
        'pop-art': 'apply pop art style with bold, vibrant colors',
        'vintage': 'apply vintage look with aged, nostalgic feel',
        'black-white': 'convert to classic black and white with good contrast',
        'vivid': 'enhance saturation and vibrancy significantly'
      };
      
      instruction = styleInstructions[params.stylePreset] || instruction;
    }

    const { data, error } = await supabase.functions.invoke('replicate', {
      body: {
        model: "cjwbw/seededit:f73fe4746be8d7feba9a20dd7b6e02be75ce73c6c2a7df14d7f31e95b2f19e6f",
        operation: 'color-enhance',
        input: {
          image: asset.src,
          prompt: instruction,
          editing_instruction: instruction,
          negative_prompt: "overexposed, underexposed, artifacts, distortion",
          seed: Math.floor(Math.random() * 1000000),
          guidance_scale: 7.5,
          num_inference_steps: 20
        }
      }
    });

    if (error) {
      throw new Error(`Color enhancement failed: ${error.message}`);
    }

    if (!data?.output) {
      throw new Error('No output received from color enhancement');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Enhanced)`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.color-enhance',
        originalAsset: asset.id,
        editType: 'color-enhancement',
        adjustments: params.colorAdjustments,
        stylePreset: params.stylePreset
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Enhanced'
    };

    return newAsset;
  }
};