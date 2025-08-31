import { TextOverlayAdapter, TextOverlayParams, Asset } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const openaiTextAdapter: TextOverlayAdapter = {
  key: "openai.text",
  
  async addText(asset: Asset, params: TextOverlayParams): Promise<Asset> {
    // First, generate enhanced text using GPT
    const { data: textData, error: textError } = await supabase.functions.invoke('openai-text', {
      body: {
        prompt: `Enhance this text for visual design: "${params.text}". Make it more compelling and visually appealing while keeping the core message.`,
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 150
      }
    });

    if (textError) {
      console.warn('Failed to enhance text with GPT, using original:', textError);
    }

    const enhancedText = textData?.text || params.text;
    
    // Create canvas for text overlay
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply text styling
        const fontSize = params.size || Math.min(img.width, img.height) * 0.1;
        ctx.font = `bold ${fontSize}px ${params.font || 'Inter, sans-serif'}`;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.05;
        ctx.textAlign = (params.align || 'center') as CanvasTextAlign;
        
        // Position text
        const x = (typeof params.position === 'object' ? params.position.x : undefined) || canvas.width / 2;
        const y = (typeof params.position === 'object' ? params.position.y : undefined) || canvas.height * 0.9;
        
        // Add text with outline
        ctx.strokeText(enhancedText, x, y);
        ctx.fillText(enhancedText, x, y);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create text overlay'));
            return;
          }
          
          resolve({
            id: crypto.randomUUID(),
            type: 'image',
            name: `${asset.name} + Text`,
            src: URL.createObjectURL(blob),
            meta: {
              ...asset.meta,
              text: enhancedText,
              originalText: params.text,
              provider: 'openai.text'
            },
            derivedFrom: asset.id,
            createdAt: Date.now(),
          });
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = asset.src;
    });
  }
};