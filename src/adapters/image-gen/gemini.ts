import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';

// Mock Gemini image generation adapter
export const geminiGen: ImageGenAdapter = {
  key: "gemini.img",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    // TODO: Replace with actual Gemini API call
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    // Create a different style synthetic image
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Gemini style - more geometric
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add geometric patterns
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = colors[i % colors.length] + '60';
      ctx.fillRect(
        Math.random() * 400 + 56,
        Math.random() * 400 + 56,
        Math.random() * 80 + 40,
        Math.random() * 80 + 40
      );
    }
    
    // Add prompt text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`Gemini: ${params.prompt.slice(0, 40)}`, 256, 50);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Gemini: ${params.prompt.slice(0, 30)}...`,
      src: URL.createObjectURL(blob),
      meta: { 
        width: 512, 
        height: 512, 
        prompt: params.prompt,
        provider: 'gemini.img'
      },
      createdAt: Date.now(),
    };
  }
};