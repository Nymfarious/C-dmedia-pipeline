import { Asset } from '@/types/media';
import { TemplateSpec } from '@/compositor/TemplateSpec';
import { makeApiRequest, API_CONFIG } from '@/config/api';

export interface TemplateCompositeParams {
  template: TemplateSpec;
  placement: {
    variables?: Record<string, any>;
    assets?: Record<string, Asset>;
  };
  options?: {
    format?: 'png' | 'webp' | 'pdf';
    quality?: number;
  };
}

export async function compositeTemplateWithNano(params: TemplateCompositeParams): Promise<Asset> {
  try {
    console.log('Starting Nano Banana template composition:', params);

    const response = await makeApiRequest('/api/supabase/invoke', {
      method: 'POST',
      body: JSON.stringify({
        function: 'template-composer',
        payload: params
      })
    });

    if (!response.success || !response.data?.output) {
      throw new Error('Template composition failed: ' + (response.error || 'Unknown error'));
    }

    // Create asset from composed template
    return {
      id: crypto.randomUUID(),
      type: 'image' as const,
      name: `Template_${params.template.name}_${Date.now()}.png`,
      src: response.data.output,
      createdAt: Date.now(),
      category: 'generated',
      subcategory: 'Template Composite',
      meta: {
        ...response.data.metadata,
        templateName: params.template.name,
        compositionMethod: 'nano-banana',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Nano template composition error:', error);
    throw error;
  }
}