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
    console.log('Calling template-composer with:', { 
      templateName: template.name,
      hasAssets: Object.keys(placement.assets || {}).length > 0,
      variables: Object.keys(placement.variables || {})
    });

    const { data, error } = await supabase.functions.invoke('template-composer', {
      body: {
        template,
        placement,
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