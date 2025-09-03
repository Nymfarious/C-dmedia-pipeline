import { TemplateSpec } from '@/compositor/TemplateSpec';
import { Asset } from '@/types/media';

/**
 * AI-powered template generation using Nano Banana through Supabase
 */
export async function generateTemplateWithAI(
  template: TemplateSpec, 
  placement: { variables?: Record<string, any>; assets?: Record<string, Asset> }
): Promise<Asset> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Process AI prompt inputs and merge with template prompts
    const processedPlacement = processAIPrompts(template, placement);
    
    console.log('Calling template-composer with:', { 
      templateName: template.name,
      hasAssets: Object.keys(placement.assets || {}).length > 0,
      variables: Object.keys(placement.variables || {}),
      aiPrompts: processedPlacement.aiPrompts
    });

    const { data, error } = await supabase.functions.invoke('template-composer', {
      body: {
        template,
        placement: processedPlacement,
        options: {
          format: template.canvas?.format || 'png',
          quality: 95,
          useNanoBanana: true
        }
      }
    });

    if (error) {
      console.error('Template composition failed:', error);
      throw new Error(`Template composition failed: ${error.message}`);
    }

    if (!data?.success || !data?.output) {
      console.error('Invalid response from template composer:', data);
      throw new Error('Template composition returned invalid response');
    }

    console.log('Template generation successful:', data.metadata);

    // Create asset from response
    return {
      id: crypto.randomUUID(),
      type: 'image' as const,
      name: `${template.name}_${Date.now()}.png`,
      src: data.output,
      createdAt: Date.now(),
      category: 'generated',
      subcategory: 'Template',
      meta: {
        ...data.metadata,
        templateName: template.name,
        generationMethod: 'nano-banana',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('AI template generation error:', error);
    throw error;
  }
}

/**
 * Process AI prompt inputs and merge with template layer prompts
 */
function processAIPrompts(
  template: TemplateSpec,
  placement: { variables?: Record<string, any>; assets?: Record<string, Asset> }
): { variables?: Record<string, any>; assets?: Record<string, Asset>; aiPrompts?: Record<string, string> } {
  const variables = placement.variables || {};
  const aiPrompts: Record<string, string> = {};

  // Extract AI-related inputs
  const userPrompt = variables['ai_prompt'] || '';
  const userStyle = variables['ai_style'] || '';
  const negativePrompt = variables['ai_negative'] || '';
  const aiParams = variables['ai_params'] || {};

  // Process each AI layer in the template
  template.layers.forEach(layer => {
    if (layer.type === 'ai-image') {
      const layerContent = layer.content as any;
      let finalPrompt = layerContent.prompt || '';

      // Merge user prompt with template prompt
      if (userPrompt) {
        finalPrompt = userPrompt + (finalPrompt ? `, ${finalPrompt}` : '');
      }

      // Apply style modifiers
      if (userStyle) {
        const styleModifiers = {
          'realistic': 'photorealistic, high detail, natural lighting',
          'artistic': 'artistic, creative, expressive style',
          'corporate': 'professional, clean, business style',
          'creative': 'bold, innovative, creative design',
          'minimal': 'minimalist, simple, clean aesthetic',
          'vibrant': 'vibrant colors, energetic, colorful',
          'vintage': 'vintage style, classic, timeless',
          'abstract': 'abstract art, non-representational'
        };
        
        const styleText = styleModifiers[userStyle] || userStyle;
        finalPrompt += `, ${styleText}`;
      }

      // Add quality enhancers
      finalPrompt += ', high quality, detailed';

      // Store the processed prompt
      aiPrompts[layer.id] = finalPrompt;
    }
  });

  return {
    variables: {
      ...variables,
      negative_prompt: negativePrompt,
      ...aiParams
    },
    assets: placement.assets,
    aiPrompts
  };
}