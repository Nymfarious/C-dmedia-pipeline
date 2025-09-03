import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import opentype from 'opentype.js';

export interface FontSpec {
  family: string;
  weight?: number;
  style?: 'normal' | 'italic';
  variant?: 'normal' | 'small-caps';
}

export class FontManager {
  private fontCache = new Map<string, Buffer>();
  private opentypeCache = new Map<string, opentype.Font>();
  private fontsDir = join(process.cwd(), 'templates', 'fonts');

  async loadFont(fontSpec: FontSpec): Promise<opentype.Font | null> {
    const fontKey = this.getFontKey(fontSpec);
    
    // Check cache first
    if (this.opentypeCache.has(fontKey)) {
      return this.opentypeCache.get(fontKey)!;
    }

    try {
      // Try to load from local fonts directory
      const fontBuffer = await this.getFontBuffer(fontSpec);
      if (fontBuffer) {
        const font = opentype.parse(fontBuffer.buffer);
        this.opentypeCache.set(fontKey, font);
        return font;
      }

      // Fallback to system fonts or web fonts
      return await this.loadSystemFont(fontSpec);
    } catch (error) {
      console.error('Error loading font:', error);
      return null;
    }
  }

  async getFontBuffer(fontSpec: FontSpec): Promise<Buffer | null> {
    const fontKey = this.getFontKey(fontSpec);
    
    if (this.fontCache.has(fontKey)) {
      return this.fontCache.get(fontKey)!;
    }

    try {
      // Look for font files in templates/fonts/
      const fontFiles = await this.findFontFiles(fontSpec);
      
      for (const fontFile of fontFiles) {
        const fontPath = join(this.fontsDir, fontFile);
        if (existsSync(fontPath)) {
          const buffer = await readFile(fontPath);
          this.fontCache.set(fontKey, buffer);
          return buffer;
        }
      }

      // Try to download from Google Fonts
      const googleFontBuffer = await this.downloadGoogleFont(fontSpec);
      if (googleFontBuffer) {
        this.fontCache.set(fontKey, googleFontBuffer);
        return googleFontBuffer;
      }

      return null;
    } catch (error) {
      console.error('Error getting font buffer:', error);
      return null;
    }
  }

  private async findFontFiles(fontSpec: FontSpec): Promise<string[]> {
    if (!existsSync(this.fontsDir)) {
      return [];
    }

    const files = await readdir(this.fontsDir);
    const fontFamily = fontSpec.family.toLowerCase().replace(/\s+/g, '-');
    
    // Generate possible font file names
    const possibleNames = [
      `${fontFamily}.ttf`,
      `${fontFamily}.otf`,
      `${fontFamily}-${fontSpec.weight || 400}.ttf`,
      `${fontFamily}-${fontSpec.weight || 400}.otf`,
      `${fontFamily}-${fontSpec.style || 'normal'}.ttf`,
      `${fontFamily}-${fontSpec.style || 'normal'}.otf`,
      `${fontFamily}-${fontSpec.weight || 400}-${fontSpec.style || 'normal'}.ttf`,
      `${fontFamily}-${fontSpec.weight || 400}-${fontSpec.style || 'normal'}.otf`
    ];

    return files.filter(file => 
      possibleNames.some(name => file.toLowerCase() === name)
    );
  }

  private async downloadGoogleFont(fontSpec: FontSpec): Promise<Buffer | null> {
    try {
      // Construct Google Fonts API URL
      const family = fontSpec.family.replace(/\s+/g, '+');
      const weight = fontSpec.weight || 400;
      const style = fontSpec.style === 'italic' ? 'i' : '';
      
      const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}${style}&display=swap`;
      
      // Fetch CSS to get font URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FontDownloader/1.0)'
        }
      });
      
      if (!response.ok) return null;
      
      const css = await response.text();
      
      // Extract font URL from CSS
      const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
      if (!urlMatch) return null;
      
      // Download the actual font file
      const fontResponse = await fetch(urlMatch[1]);
      if (!fontResponse.ok) return null;
      
      const arrayBuffer = await fontResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading Google Font:', error);
      return null;
    }
  }

  private async loadSystemFont(fontSpec: FontSpec): Promise<opentype.Font | null> {
    // This would need platform-specific implementation
    // For now, return null and fall back to default fonts
    return null;
  }

  private getFontKey(fontSpec: FontSpec): string {
    return `${fontSpec.family}-${fontSpec.weight || 400}-${fontSpec.style || 'normal'}-${fontSpec.variant || 'normal'}`;
  }

  public getFontString(fontSpec: FontSpec): string {
    const weight = fontSpec.weight || 400;
    const style = fontSpec.style || 'normal';
    const variant = fontSpec.variant || 'normal';
    
    return `${style} ${variant} ${weight} ${fontSpec.family}`;
  }
}