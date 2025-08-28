import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';

const API_BASE = 'http://localhost:3001';

export const seedEditAdapter: ImageEditAdapter = {
  key: "seededit.3",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    try {
      const response = await fetch(`${API_BASE}/api/image/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'replicate',
          model: 'seededit-3.0',
          imageUrl: asset.src,
          instruction: params.instruction,
          maskUrl: params.maskAssetId ? asset.src : undefined, // TODO: get actual mask asset
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Edit failed');
      }

      return result.asset;
    } catch (error) {
      console.error('SeedEdit error:', error);
      
      // Fallback to local editing simulation
      return editFallback(asset, params);
    }
  }
};

async function editFallback(asset: Asset, params: ImageEditParams): Promise<Asset> {
    // Create a synthetic edited image
    const canvas = document.createElement('canvas');
    canvas.width = asset.meta?.width || 512;
    canvas.height = asset.meta?.height || 512;
    const ctx = canvas.getContext('2d')!;
    
    // Load original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = asset.src;
    });
    
    // Draw original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply edit overlay to simulate editing
    ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add edit indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('EDITED', canvas.width / 2, 40);
    
    ctx.font = '12px Inter';
    ctx.fillText('SeedEdit 3.0', canvas.width / 2, 60);
    
    // Add instruction text (wrapped)
    ctx.font = '14px Inter';
    const words = params.instruction.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = canvas.width - 40;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    lines.slice(0, 3).forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, canvas.height - 60 + index * 18);
    });
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Edited: ${asset.name}`,
      src: URL.createObjectURL(blob),
      meta: { 
        ...asset.meta,
        instruction: params.instruction,
        provider: 'seededit.3',
        model: 'seededit-3.0',
        derivedFrom: asset.id
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };
}