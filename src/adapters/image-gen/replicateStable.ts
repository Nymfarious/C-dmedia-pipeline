import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';

// Mock implementation with actual image generation
export const replicateStable: ImageGenAdapter = {
  key: "replicate.sd",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    // TODO: Replace with actual Replicate API call
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    // Create a synthetic image based on prompt
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create a gradient based on prompt keywords
    const colors = getColorsFromPrompt(params.prompt);
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * 512, 
        Math.random() * 512, 
        Math.random() * 20 + 5, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Add prompt text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(params.prompt.slice(0, 50), 256, 256);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Generated: ${params.prompt.slice(0, 30)}...`,
      src: URL.createObjectURL(blob),
      meta: { 
        width: 512, 
        height: 512, 
        prompt: params.prompt,
        provider: 'replicate.sd'
      },
      createdAt: Date.now(),
    };
  }
};

function getColorsFromPrompt(prompt: string): [string, string] {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('fire') || lowerPrompt.includes('red')) {
    return ['#EF4444', '#DC2626'];
  }
  if (lowerPrompt.includes('ocean') || lowerPrompt.includes('blue') || lowerPrompt.includes('water')) {
    return ['#3B82F6', '#1E40AF'];
  }
  if (lowerPrompt.includes('forest') || lowerPrompt.includes('green') || lowerPrompt.includes('nature')) {
    return ['#10B981', '#059669'];
  }
  if (lowerPrompt.includes('purple') || lowerPrompt.includes('magic') || lowerPrompt.includes('mystic')) {
    return ['#8B5CF6', '#7C3AED'];
  }
  if (lowerPrompt.includes('sun') || lowerPrompt.includes('yellow') || lowerPrompt.includes('gold')) {
    return ['#F59E0B', '#D97706'];
  }
  
  // Default gradient
  return ['#8B5CF6', '#06B6D4'];
}