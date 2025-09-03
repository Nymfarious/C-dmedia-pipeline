import { TemplatePlacement } from './TemplateSpec';

export async function resolveAsset(source: string, placements: TemplatePlacement): Promise<string> {
  // Handle different types of asset references
  
  // Direct URL
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return source;
  }
  
  // Data URL
  if (source.startsWith('data:')) {
    return source;
  }
  
  // Asset ID reference ($asset_id)
  if (source.startsWith('$asset_')) {
    const assetId = source.slice(1);
    const assetUrl = placements[assetId];
    if (assetUrl) {
      return assetUrl;
    }
    throw new Error(`Asset not found: ${assetId}`);
  }
  
  // Placement variable (${variable})
  if (source.startsWith('${') && source.endsWith('}')) {
    const variableName = source.slice(2, -1);
    const value = placements[variableName];
    if (value) {
      return String(value);
    }
    throw new Error(`Variable not found: ${variableName}`);
  }
  
  // Local asset path (relative to public folder)
  if (source.startsWith('/') || source.startsWith('./')) {
    return source;
  }
  
  // Default: treat as asset path
  return `/assets/${source}`;
}

export function resolveColor(color: string, placements: TemplatePlacement): string {
  // Handle color variable references
  if (color.startsWith('${') && color.endsWith('}')) {
    const variableName = color.slice(2, -1);
    const value = placements[variableName];
    if (value) {
      return String(value);
    }
  }
  
  return color;
}

export function validateAssetUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function preloadAsset(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload asset: ${url}`));
    img.src = url;
  });
}

export async function getAssetDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error(`Failed to load asset for dimensions: ${url}`));
    img.src = url;
  });
}