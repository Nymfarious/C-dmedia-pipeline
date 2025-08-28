import { ImageEditAdapter, ImageEditParams, Asset } from '@/types/media';

// Mock image editor adapter
export const mockEditor: ImageEditAdapter = {
  key: "editor.mock",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    
    // Create edited version by applying a filter effect
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
        
        // Apply edit effect based on instruction
        const instruction = params.instruction.toLowerCase();
        
        if (instruction.includes('darker') || instruction.includes('shadow')) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (instruction.includes('brighter') || instruction.includes('light')) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (instruction.includes('blur')) {
          ctx.filter = 'blur(2px)';
          ctx.drawImage(img, 0, 0);
          ctx.filter = 'none';
        } else {
          // Default: add a colored overlay
          ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Add edit indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '12px Inter';
        ctx.fillText(`Edited: ${params.instruction.slice(0, 20)}`, 10, 25);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              id: crypto.randomUUID(),
              type: 'image',
              name: `Edited: ${asset.name}`,
              src: URL.createObjectURL(blob),
              meta: { 
                ...asset.meta,
                editInstruction: params.instruction,
                provider: 'editor.mock'
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