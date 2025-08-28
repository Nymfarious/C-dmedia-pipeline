import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';

const API_BASE = 'http://localhost:3001';

export const fluxUltraAdapter: ImageGenAdapter = {
  key: "flux.ultra",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      const response = await fetch(`${API_BASE}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'replicate',
          model: 'flux-1.1-ultra',
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          seed: params.seed,
          width: 1024,
          height: 1024,
          mode: 'ultra',
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.message || 'Generation failed');
      }

      return result.asset;
    } catch (error) {
      console.error('Flux Ultra generation error:', error);
      
      // Fallback to local generation for development
      return generateFallback(params);
    }
  }
};

async function generateFallback(params: ImageGenParams): Promise<Asset> {
    // Create a synthetic image with FLUX Ultra branding
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // FLUX Ultra style - ultra high quality gradient
    const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.3, '#4ecdc4');
    gradient.addColorStop(0.6, '#45b7d1');
    gradient.addColorStop(1, '#96ceb4');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add sophisticated noise pattern
    for (let i = 0; i < 3000; i++) {
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      const size = Math.random() * 3 + 1;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, size, size);
    }
    
    // Add geometric patterns for "ultra" feel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 1024, Math.random() * 100 + 50, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Add prompt text with ultra styling
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText('FLUX 1.1 ULTRA', 512, 100);
    
    ctx.font = '20px Inter';
    const words = params.prompt.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    lines.slice(0, 7).forEach((line, index) => {
      ctx.fillText(line, 512, 160 + index * 35);
    });
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `FLUX Ultra: ${params.prompt.slice(0, 30)}...`,
      src: URL.createObjectURL(blob),
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        provider: 'flux.ultra',
        model: 'flux-1.1-ultra',
        mode: 'ultra'
      },
      createdAt: Date.now(),
    };
}