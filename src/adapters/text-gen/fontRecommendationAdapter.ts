import { TextOverlayAdapter, TextOverlayParams, Asset } from '@/types/media';

interface FontRecommendation {
  name: string;
  category: 'serif' | 'sans-serif' | 'display' | 'script';
  mood: string;
  googleFont: string;
}

const FONT_DATABASE: FontRecommendation[] = [
  { name: 'Playfair Display', category: 'serif', mood: 'elegant, luxury, editorial', googleFont: 'Playfair+Display:wght@400;700;900' },
  { name: 'Montserrat', category: 'sans-serif', mood: 'modern, clean, professional', googleFont: 'Montserrat:wght@400;600;800' },
  { name: 'Oswald', category: 'sans-serif', mood: 'bold, impactful, industrial', googleFont: 'Oswald:wght@400;600;700' },
  { name: 'Dancing Script', category: 'script', mood: 'casual, friendly, handwritten', googleFont: 'Dancing+Script:wght@400;700' },
  { name: 'Bebas Neue', category: 'display', mood: 'strong, condensed, modern', googleFont: 'Bebas+Neue' },
  { name: 'Roboto Slab', category: 'serif', mood: 'tech, readable, structured', googleFont: 'Roboto+Slab:wght@400;700' },
  { name: 'Poppins', category: 'sans-serif', mood: 'geometric, friendly, approachable', googleFont: 'Poppins:wght@400;600;800' },
  { name: 'Abril Fatface', category: 'display', mood: 'dramatic, editorial, bold', googleFont: 'Abril+Fatface' }
];

export const fontRecommendationAdapter: TextOverlayAdapter = {
  key: "ai.font-recommendation",
  
  async addText(asset: Asset, params: TextOverlayParams): Promise<Asset> {
    // Analyze image to recommend font
    const imageAnalysis = await analyzeImageForFont(asset);
    const recommendedFont = selectBestFont(params.text, imageAnalysis);
    
    // Load Google Font dynamically
    await loadGoogleFont(recommendedFont.googleFont);
    
    // Create text overlay with recommended font
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply recommended font styling
        const fontSize = params.size || Math.min(img.width, img.height) * 0.08;
        ctx.font = `600 ${fontSize}px "${recommendedFont.name}", sans-serif`;
        
        // Smart color selection based on image
        const textColor = imageAnalysis.isDark ? '#ffffff' : '#000000';
        const shadowColor = imageAnalysis.isDark ? '#000000' : '#ffffff';
        
        ctx.fillStyle = textColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = fontSize * 0.1;
        ctx.textAlign = (params.align || 'center') as CanvasTextAlign;
        
        // Smart positioning
        const x = (typeof params.position === 'object' ? params.position.x : undefined) || canvas.width / 2;
        const y = (typeof params.position === 'object' ? params.position.y : undefined) || (imageAnalysis.bestTextArea === 'top' ? canvas.height * 0.2 : canvas.height * 0.8);
        
        // Add text
        ctx.fillText(params.text, x, y);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create font recommendation overlay'));
            return;
          }
          
          resolve({
            id: crypto.randomUUID(),
            type: 'image',
            name: `${asset.name} + ${recommendedFont.name}`,
            src: URL.createObjectURL(blob),
            meta: {
              ...asset.meta,
              text: params.text,
              recommendedFont: recommendedFont.name,
              fontMood: recommendedFont.mood,
              provider: 'ai.font-recommendation'
            },
            derivedFrom: asset.id,
            createdAt: Date.now(),
          });
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = asset.src;
    });
  }
};

async function analyzeImageForFont(asset: Asset): Promise<{ isDark: boolean; dominantColors: string[]; bestTextArea: 'top' | 'bottom' }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Sample pixels to determine brightness
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let totalBrightness = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      
      const avgBrightness = totalBrightness / (pixels.length / 4);
      const isDark = avgBrightness < 128;
      
      // Determine best text area (simplified)
      const topHalfData = ctx.getImageData(0, 0, canvas.width, canvas.height / 2);
      const bottomHalfData = ctx.getImageData(0, canvas.height / 2, canvas.width, canvas.height / 2);
      
      const topBrightness = calculateBrightness(topHalfData.data);
      const bottomBrightness = calculateBrightness(bottomHalfData.data);
      
      const bestTextArea = Math.abs(topBrightness - 128) > Math.abs(bottomBrightness - 128) ? 'top' : 'bottom';
      
      resolve({
        isDark,
        dominantColors: [], // Simplified for now
        bestTextArea
      });
    };
    img.src = asset.src;
  });
}

function calculateBrightness(pixels: Uint8ClampedArray): number {
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  }
  return total / (pixels.length / 4);
}

function selectBestFont(text: string, analysis: { isDark: boolean; dominantColors: string[]; bestTextArea: 'top' | 'bottom' }): FontRecommendation {
  // Simple font selection logic
  const textLength = text.length;
  const isShort = textLength < 20;
  const hasNumbers = /\d/.test(text);
  const isAllCaps = text === text.toUpperCase();
  
  if (isAllCaps || isShort) {
    return FONT_DATABASE.find(f => f.category === 'display') || FONT_DATABASE[4];
  }
  
  if (hasNumbers) {
    return FONT_DATABASE.find(f => f.name === 'Roboto Slab') || FONT_DATABASE[5];
  }
  
  // Default to clean sans-serif
  return FONT_DATABASE.find(f => f.name === 'Poppins') || FONT_DATABASE[6];
}

async function loadGoogleFont(fontQuery: string): Promise<void> {
  if (document.querySelector(`link[href*="${fontQuery}"]`)) {
    return; // Already loaded
  }
  
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
}