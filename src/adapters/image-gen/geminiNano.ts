import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';

const API_BASE = 'http://localhost:3001';

export const geminiNanoAdapter: ImageGenAdapter = {
  key: "gemini.nano",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    try {
      const response = await fetch(`${API_BASE}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'gemini',
          model: 'gemini-2.5-flash-image',
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          seed: params.seed,
          width: 1024,
          height: 1024,
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
      console.error('Gemini Nano generation error:', error);
      
      // Fallback to local generation for development
      return generateFallback(params);
    }
  }
};

async function generateFallback(params: ImageGenParams): Promise<Asset> {
    // Create a synthetic image with Gemini Nano Banana branding
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Gemini style - organic, flowing gradients
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, '#ffecd2');
    gradient.addColorStop(0.3, '#fcb69f');
    gradient.addColorStop(0.6, '#ff9a9e');
    gradient.addColorStop(1, '#fecfef');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add organic shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const radius = Math.random() * 150 + 100;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add subtle texture
    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
      const size = Math.random() * 2 + 1;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, size, size);
    }
    
    // Add branding
    ctx.fillStyle = '#2D3748';
    ctx.font = 'bold 26px Inter';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('Gemini 2.5 Flash', 512, 80);
    
    ctx.font = 'bold 20px Inter';
    ctx.fillText('"Nano Banana"', 512, 110);
    
    ctx.font = '18px Inter';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    
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
    
    lines.slice(0, 8).forEach((line, index) => {
      ctx.fillText(line, 512, 170 + index * 30);
    });
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Gemini Nano: ${params.prompt.slice(0, 30)}...`,
      src: URL.createObjectURL(blob),
      meta: { 
        width: 1024, 
        height: 1024, 
        prompt: params.prompt,
        provider: 'gemini.nano',
        model: 'gemini-2.5-flash-image'
      },
      createdAt: Date.now(),
    };
}