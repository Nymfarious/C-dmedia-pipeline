import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { downloadAndUploadImage } from '@/lib/assetStorage';

export const geminiConversationalAdapter: ImageEditAdapter = {
  key: "gemini.conversational-edit",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const instruction = params.instruction || "Edit this image";
    
    // Ensure image is in our storage
    let imageUrl = asset.src;
    if (!asset.src.includes(supabase.storage.from('ai-images').getPublicUrl('').data.publicUrl)) {
      const imageUpload = await downloadAndUploadImage(asset.src);
      if (!imageUpload.error) {
        imageUrl = imageUpload.url;
      }
    }

    const { data, error } = await supabase.functions.invoke('gemini-nano', {
      body: {
        operation: 'conversational-edit',
        input: {
          image: imageUrl,
          instruction,
          negative_prompt: "blurred, distorted, artifacts, low quality",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.8
        }
      }
    });

    if (error) {
      throw new Error(`Gemini conversational edit failed: ${error.message}`);
    }

    if (!data?.output?.[0]) {
      throw new Error('No output received from Gemini');
    }

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name || 'image'} - Gemini edited`,
      src: Array.isArray(data.output) ? data.output[0] : data.output,
      meta: {
        ...asset.meta,
        provider: 'gemini.conversational-edit',
        originalAsset: asset.id,
        editType: 'conversational',
        instruction,
        synthid_watermarked: true
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'AI Conversational'
    };

    return newAsset;
  }
};