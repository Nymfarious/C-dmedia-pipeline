import { TextOverlayAdapter, TextOverlayParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const fluxTextAdapter: TextOverlayAdapter = {
  key: "flux.text",
  
  async addText(asset: Asset, params: TextOverlayParams): Promise<Asset> {
    console.log('FluxTextAdapter - Adding text with params:', params);
    
    const { data, error } = await supabase.functions.invoke('replicate-enhanced', {
      body: {
        operation: 'text-generation',
        input: {
          image: asset.src,
          text_prompt: params.text,
          text_style: {
            fontSize: params.fontSize || 'medium',
            color: params.color || 'auto',
            effect: params.effect || 'none'
          },
          position: params.position
        }
      }
    });

    console.log('FluxTextAdapter - Response:', { data, error });

    if (error) {
      throw new Error(`Text generation failed: ${error.message}`);
    }

    if (!data?.output) {
      console.error('FluxTextAdapter - No output received:', { data, error });
      throw new Error('No output received from text generation');
    }

    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name} + Text: ${params.text.slice(0, 20)}...`,
      src: imageUrl,
      meta: { 
        width: asset.meta?.width || 1024, 
        height: asset.meta?.height || 1024, 
        text: params.text,
        originalAsset: asset.id,
        provider: 'flux.text',
        model: 'flux-dev'
      },
      createdAt: Date.now(),
    };
  }
};