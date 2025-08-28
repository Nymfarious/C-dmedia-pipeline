import { TextOverlayAdapter, TextOverlayParams, Asset } from '@/types/media';

// Canvas-based text overlay adapter
export const canvasOverlay: TextOverlayAdapter = {
  key: "canvas.text",
  
  async addText(asset: Asset, params: TextOverlayParams): Promise<Asset> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Configure text style
        const fontSize = params.size || 32;
        const font = params.font || 'Inter';
        ctx.font = `bold ${fontSize}px ${font}`;
        ctx.textAlign = params.align || 'center';
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Set text color
        ctx.fillStyle = '#FFFFFF';
        
        // Calculate position
        const x = params.position?.x || canvas.width / 2;
        const y = params.position?.y || canvas.height / 2;
        
        // Draw text
        const lines = params.text.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(line, x, y + (index * fontSize * 1.2));
        });
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              id: crypto.randomUUID(),
              type: 'image',
              name: `${asset.name} + Text`,
              src: URL.createObjectURL(blob),
              meta: { 
                ...asset.meta,
                textOverlay: params.text,
                provider: 'canvas.text'
              },
              createdAt: Date.now(),
              derivedFrom: asset.id,
            });
          }
        }, 'image/png');
      };
      
      img.src = asset.src;
    });
  }
};