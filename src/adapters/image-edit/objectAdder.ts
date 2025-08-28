import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

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

    const body = {
      provider: "replicate",
      model: "flux-inpaint",          // good for additive edits
      imageUrl: asset.src,
      instruction,
      maskDataUrl
    };

    const res = await fetch(`${API_BASE}/api/image/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Edit failed: ${res.status} ${res.statusText}`);
    const result = await res.json();
    if (!result?.asset?.src) throw new Error(result?.message || "Edit failed");

    const newAsset: Asset = {
      id: result.asset.id ?? crypto.randomUUID(),
      type: 'image',
      name: result.asset.name ?? `${asset.name || 'image'} - object added`,
      src: result.asset.src,
      meta: {
        ...asset.meta,
        provider: result.asset.meta?.provider ?? 'replicate.flux-inpaint',
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