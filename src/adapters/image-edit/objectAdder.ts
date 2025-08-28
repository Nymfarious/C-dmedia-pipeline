import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';

export const objectAdderAdapter: ImageEditAdapter = {
  key: "replicate.object-add",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const instruction = params.addObjectInstruction || params.instruction || "Add the described object inside the masked region";

    // If user didn't paint a mask but clicked somewhere, synthesize a small circular mask
    let maskDataUrl = params.maskPngDataUrl ?? null;

    if (!maskDataUrl && params.clickPosition && params.sourceImageSize) {
      // Build a small mask around click (client-side)
      const { width, height } = params.sourceImageSize; // px of the source image
      const radius = Math.max(24, Math.floor(Math.min(width, height) * 0.05));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(params.clickPosition.x, params.clickPosition.y, radius, 0, Math.PI*2);
      ctx.fill();
      maskDataUrl = canvas.toDataURL('image/png');
    }

    if (!maskDataUrl) {
      throw new Error("No target region provided. Paint a mask or click to place.");
    }

    // Call Supabase edge function for Replicate
    const body = {
      model: "black-forest-labs/flux.1-dev",
      operation: "add-object",
      input: {
        image: asset.src,
        prompt: instruction,
        mask: maskDataUrl,
        strength: 0.8,
        guidance_scale: 3.5,
        num_inference_steps: 28
      }
    };

    const { data: result, error } = await supabase.functions.invoke('replicate', {
      body
    });

    if (error) throw new Error(`Edit failed: ${error.message}`);
    if (!result?.output?.[0]) throw new Error("Edit failed - no output");

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `${asset.name || 'image'} - object added`,
      src: Array.isArray(result.output) ? result.output[0] : result.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.object-add',
        originalAsset: asset.id,
        editType: 'object-addition',
        instruction
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Additive'
    };

    return newAsset;
  }
};