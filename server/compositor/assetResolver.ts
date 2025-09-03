import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class AssetResolver {
  private assetCache = new Map<string, Buffer>();
  private assetsDir = join(process.cwd(), 'public');

  async resolveAsset(source: string): Promise<Buffer | null> {
    // Check cache first
    if (this.assetCache.has(source)) {
      return this.assetCache.get(source)!;
    }

    try {
      let buffer: Buffer | null = null;

      // Handle different source types
      if (source.startsWith('http://') || source.startsWith('https://')) {
        // Remote URL
        buffer = await this.fetchRemoteAsset(source);
      } else if (source.startsWith('data:')) {
        // Data URL
        buffer = this.parseDataUrl(source);
      } else {
        // Local file path
        buffer = await this.loadLocalAsset(source);
      }

      if (buffer) {
        this.assetCache.set(source, buffer);
      }

      return buffer;
    } catch (error) {
      console.error('Error resolving asset:', source, error);
      return null;
    }
  }

  private async fetchRemoteAsset(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching remote asset:', error);
      return null;
    }
  }

  private parseDataUrl(dataUrl: string): Buffer | null {
    try {
      const [header, data] = dataUrl.split(',');
      if (!header || !data) return null;
      
      const isBase64 = header.includes('base64');
      if (isBase64) {
        return Buffer.from(data, 'base64');
      } else {
        return Buffer.from(decodeURIComponent(data));
      }
    } catch (error) {
      console.error('Error parsing data URL:', error);
      return null;
    }
  }

  private async loadLocalAsset(path: string): Promise<Buffer | null> {
    try {
      // Remove leading slash and resolve relative to public directory
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const fullPath = join(this.assetsDir, cleanPath);
      
      if (!existsSync(fullPath)) {
        console.warn('Asset not found:', fullPath);
        return null;
      }

      return await readFile(fullPath);
    } catch (error) {
      console.error('Error loading local asset:', error);
      return null;
    }
  }

  public clearCache(): void {
    this.assetCache.clear();
  }

  public getCacheSize(): number {
    let totalSize = 0;
    for (const buffer of this.assetCache.values()) {
      totalSize += buffer.length;
    }
    return totalSize;
  }

  public getCacheStats(): { entries: number; totalSize: number; avgSize: number } {
    const entries = this.assetCache.size;
    const totalSize = this.getCacheSize();
    const avgSize = entries > 0 ? totalSize / entries : 0;
    
    return { entries, totalSize, avgSize };
  }
}