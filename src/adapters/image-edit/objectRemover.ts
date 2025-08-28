import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export const objectRemoverAdapter: ImageEditAdapter = {
  key: "replicate.object-remove",

  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    if (!params.maskPngDataUrl && !params.maskBlob) {
      throw new Error("No mask provided. Paint an area to remove first.");
    }
    const instruction = params.removeObjectInstruction || params.instruction || "Remove the marked objects cleanly";

    // Upload the mask (data URL or Blob) to the server; simplest: send as data URL
    const body = {
      provider: "replicate",              // or "gemini" later
      model: "seededit-3",                // or "flux-inpaint"
      imageUrl: asset.src,                // ensure this is a public URL or your server can fetch blobs
      instruction,
      // prefer dataUrl for simplicity; your server can accept either
      maskDataUrl: params.maskPngDataUrl ?? null
    };

    const res = await fetch(`${API_BASE}/api/image/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Edit failed: ${res.status} ${res.statusText}`);
    const result = await res.json();
    if (!result?.asset?.src) throw new Error(result?.message || "Edit failed");

    // Normalize to Asset
    const newAsset: Asset = {
      id: result.asset.id ?? crypto.randomUUID(),
      type: 'image',
      name: result.asset.name ?? `${asset.name || 'image'} - object removed`,
      src: result.asset.src,
      meta: {
        ...asset.meta,
        provider: result.asset.meta?.provider ?? 'replicate.seededit',
        originalAsset: asset.id,
        editType: 'object-removal',
        instruction
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
      category: 'edited',
      subcategory: 'Cleanup'
    };

    return newAsset;
  }
};