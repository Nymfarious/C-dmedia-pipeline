/**
 * Advanced mask processing utilities for improved inpainting results
 */

export interface MaskProcessingOptions {
  padding?: number;
  featherRadius?: number;
  qualityCheck?: boolean;
}

export interface MaskQualityInfo {
  isValid: boolean;
  area: number;
  coverage: number;
  aspectRatio: number;
  warnings: string[];
  suggestions: string[];
}

/**
 * Process mask with padding and feathering
 */
export async function processMask(
  maskDataUrl: string,
  options: MaskProcessingOptions = {}
): Promise<{ dataUrl: string; blob: Blob; quality: MaskQualityInfo }> {
  const { padding = 12, featherRadius = 3, qualityCheck = true } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original mask
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Quality analysis
        let quality: MaskQualityInfo = {
          isValid: true,
          area: 0,
          coverage: 0,
          aspectRatio: canvas.width / canvas.height,
          warnings: [],
          suggestions: []
        };
        
        if (qualityCheck) {
          quality = analyzeMaskQuality(data, canvas.width, canvas.height);
        }
        
        // Apply padding
        if (padding > 0) {
          applyMaskPadding(data, canvas.width, canvas.height, padding);
        }
        
        // Apply feathering
        if (featherRadius > 0) {
          applyMaskFeathering(data, canvas.width, canvas.height, featherRadius);
        }
        
        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process mask'));
            return;
          }
          
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            blob,
            quality
          });
        }, 'image/png');
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load mask image'));
    img.src = maskDataUrl;
  });
}

/**
 * Analyze mask quality and provide feedback
 */
function analyzeMaskQuality(data: Uint8ClampedArray, width: number, height: number): MaskQualityInfo {
  let whitePixels = 0;
  let totalPixels = width * height;
  
  // Count white pixels (mask area)
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 128) { // Consider semi-transparent as part of mask
      whitePixels++;
    }
  }
  
  const coverage = whitePixels / totalPixels;
  const area = whitePixels;
  
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Coverage analysis
  if (coverage < 0.001) {
    warnings.push('Mask area is very small');
    suggestions.push('Try painting a larger area for better results');
  } else if (coverage > 0.7) {
    warnings.push('Mask covers most of the image');
    suggestions.push('Consider painting a smaller, more specific area');
  }
  
  // Size recommendations
  if (area < 100) {
    suggestions.push('Paint a larger area for more stable inpainting');
  }
  
  return {
    isValid: coverage > 0.0001 && coverage < 0.8,
    area,
    coverage,
    aspectRatio: width / height,
    warnings,
    suggestions
  };
}

/**
 * Apply padding around mask areas
 */
function applyMaskPadding(data: Uint8ClampedArray, width: number, height: number, padding: number) {
  const originalData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Skip if already white
      if (originalData[idx + 3] > 128) continue;
      
      // Check surrounding pixels for mask presence
      let hasNearbyMask = false;
      for (let dy = -padding; dy <= padding; dy++) {
        for (let dx = -padding; dx <= padding; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nearIdx = (ny * width + nx) * 4;
            if (originalData[nearIdx + 3] > 128) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= padding) {
                hasNearbyMask = true;
                break;
              }
            }
          }
        }
        if (hasNearbyMask) break;
      }
      
      // Add to mask if near existing mask
      if (hasNearbyMask) {
        data[idx] = 255;     // R
        data[idx + 1] = 255; // G
        data[idx + 2] = 255; // B
        data[idx + 3] = 255; // A
      }
    }
  }
}

/**
 * Apply gaussian blur for mask feathering
 */
function applyMaskFeathering(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  const kernel = createGaussianKernel(radius);
  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);
  
  const originalData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = x + kx - halfKernel;
          const py = y + ky - halfKernel;
          
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const alpha = originalData[idx + 3];
            const weight = kernel[ky][kx];
            
            weightedSum += alpha * weight;
            weightSum += weight;
          }
        }
      }
      
      const smoothedAlpha = weightSum > 0 ? weightedSum / weightSum : 0;
      const idx = (y * width + x) * 4;
      
      // Apply smoothed alpha to all channels
      const intensity = smoothedAlpha / 255;
      data[idx] = 255 * intensity;     // R
      data[idx + 1] = 255 * intensity; // G
      data[idx + 2] = 255 * intensity; // B
      data[idx + 3] = smoothedAlpha;   // A
    }
  }
}

/**
 * Create gaussian kernel for blur
 */
function createGaussianKernel(radius: number): number[][] {
  const size = Math.ceil(radius * 2) + 1;
  const kernel: number[][] = [];
  const sigma = radius / 3;
  let sum = 0;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - Math.floor(size / 2);
      const dy = y - Math.floor(size / 2);
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[y][x] = value;
      sum += value;
    }
  }
  
  // Normalize kernel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }
  
  return kernel;
}