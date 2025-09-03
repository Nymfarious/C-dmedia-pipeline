import { MaskLayerContent } from './TemplateSpec';

export async function applyMask(
  ctx: CanvasRenderingContext2D,
  maskContent: MaskLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): Promise<void> {
  // Create a temporary canvas for the mask
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Could not create mask context');

  maskCanvas.width = layout.width;
  maskCanvas.height = layout.height;

  // Load and draw the mask
  if (maskContent.source.endsWith('.svg')) {
    await applySvgMask(maskCtx, maskContent, layout);
  } else {
    await applyImageMask(maskCtx, maskContent, layout);
  }

  // Apply feather effect if specified
  if (maskContent.feather && maskContent.feather > 0) {
    applyFeather(maskCtx, maskContent.feather, layout.width, layout.height);
  }

  // Invert mask if specified
  if (maskContent.inverted) {
    invertMask(maskCtx, layout.width, layout.height);
  }

  // Apply the mask to the main context
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, layout.x, layout.y);
  ctx.restore();
}

async function applyImageMask(
  ctx: CanvasRenderingContext2D,
  maskContent: MaskLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Draw the image and extract alpha channel
      ctx.drawImage(img, 0, 0, layout.width, layout.height);
      
      // Convert to grayscale mask
      const imageData = ctx.getImageData(0, 0, layout.width, layout.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert RGB to grayscale and use as alpha
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = gray; // A (use grayscale as alpha)
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve();
    };
    
    img.onerror = () => reject(new Error(`Failed to load mask image: ${maskContent.source}`));
    img.src = maskContent.source;
  });
}

async function applySvgMask(
  ctx: CanvasRenderingContext2D,
  maskContent: MaskLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(maskContent.source)
      .then(response => response.text())
      .then(svgText => {
        // Create a blob URL for the SVG
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, layout.width, layout.height);
          URL.revokeObjectURL(url);
          
          // Convert to alpha mask
          const imageData = ctx.getImageData(0, 0, layout.width, layout.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = gray;
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve();
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load SVG mask: ${maskContent.source}`));
        };
        
        img.src = url;
      })
      .catch(reject);
  });
}

function applyFeather(
  ctx: CanvasRenderingContext2D,
  featherAmount: number,
  width: number,
  height: number
): void {
  // Apply a blur filter to create feather effect
  ctx.filter = `blur(${featherAmount}px)`;
  
  // Create a temporary canvas to apply the blur
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  tempCanvas.width = width;
  tempCanvas.height = height;
  
  // Copy current content
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Clear and redraw with blur
  ctx.clearRect(0, 0, width, height);
  ctx.filter = `blur(${featherAmount}px)`;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = 'none';
}

function invertMask(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Invert alpha channel
  }
  
  ctx.putImageData(imageData, 0, 0);
}

export function createCircularMask(
  width: number,
  height: number,
  centerX?: number,
  centerY?: number,
  radius?: number
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  
  canvas.width = width;
  canvas.height = height;
  
  const cx = centerX ?? width / 2;
  const cy = centerY ?? height / 2;
  const r = radius ?? Math.min(width, height) / 2;
  
  // Create circular gradient
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return ctx.getImageData(0, 0, width, height);
}

export function createRectangularMask(
  width: number,
  height: number,
  feather: number = 0
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  
  canvas.width = width;
  canvas.height = height;
  
  if (feather > 0) {
    // Create gradient from edges
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(feather / width, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1 - feather / width, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, width, height);
  }
  
  return ctx.getImageData(0, 0, width, height);
}