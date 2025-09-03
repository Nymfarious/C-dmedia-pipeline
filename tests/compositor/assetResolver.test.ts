import { describe, it, expect, vi } from 'vitest';
import { 
  resolveAsset, 
  resolveColor, 
  validateAssetUrl, 
  preloadAsset, 
  getAssetDimensions 
} from '@/compositor/assetResolver';
import { TemplatePlacement } from '@/compositor/TemplateSpec';

describe('Asset Resolver', () => {
  const mockPlacements: TemplatePlacement = {
    asset_logo: 'https://example.com/logo.png',
    user_avatar: 'https://example.com/avatar.jpg',
    primary_color: '#ff0000',
    secondary_color: '#00ff00',
    brand_name: 'Test Brand',
  };

  describe('resolveAsset', () => {
    it('should handle direct HTTP URLs', async () => {
      const source = 'https://example.com/image.png';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe(source);
    });

    it('should handle data URLs', async () => {
      const source = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe(source);
    });

    it('should resolve asset ID references', async () => {
      const source = '$asset_logo';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe('https://example.com/logo.png');
    });

    it('should resolve placement variables', async () => {
      const source = '${user_avatar}';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe('https://example.com/avatar.jpg');
    });

    it('should handle local asset paths starting with /', async () => {
      const source = '/assets/local-image.png';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe(source);
    });

    it('should handle relative paths', async () => {
      const source = './images/relative-image.png';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe(source);
    });

    it('should default to assets folder for simple names', async () => {
      const source = 'simple-image.png';
      const result = await resolveAsset(source, mockPlacements);
      expect(result).toBe('/assets/simple-image.png');
    });

    it('should throw error for missing asset reference', async () => {
      const source = '$asset_missing';
      await expect(resolveAsset(source, mockPlacements))
        .rejects.toThrow('Asset not found: asset_missing');
    });

    it('should throw error for missing variable', async () => {
      const source = '${missing_variable}';
      await expect(resolveAsset(source, mockPlacements))
        .rejects.toThrow('Variable not found: missing_variable');
    });
  });

  describe('resolveColor', () => {
    it('should resolve color variables', () => {
      const color = '${primary_color}';
      const result = resolveColor(color, mockPlacements);
      expect(result).toBe('#ff0000');
    });

    it('should return color as-is if not a variable', () => {
      const color = '#0000ff';
      const result = resolveColor(color, mockPlacements);
      expect(result).toBe('#0000ff');
    });

    it('should return original color for missing variable', () => {
      const color = '${missing_color}';
      const result = resolveColor(color, mockPlacements);
      expect(result).toBe('${missing_color}');
    });
  });

  describe('validateAssetUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateAssetUrl('https://example.com/image.png')).toBe(true);
      expect(validateAssetUrl('http://example.com/image.jpg')).toBe(true);
      expect(validateAssetUrl('data:image/png;base64,abc123')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateAssetUrl('not-a-url')).toBe(false);
      expect(validateAssetUrl('')).toBe(false);
      expect(validateAssetUrl('://invalid')).toBe(false);
    });
  });

  describe('preloadAsset', () => {
    it('should preload valid image URLs', async () => {
      // Mock successful image load
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: null as string | null,
        set src(value: string) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      await expect(preloadAsset('https://example.com/image.png'))
        .resolves.toBeUndefined();
    });

    it('should reject on image load error', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: null as string | null,
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      await expect(preloadAsset('https://example.com/invalid-image.png'))
        .rejects.toThrow('Failed to preload asset');
    });
  });

  describe('getAssetDimensions', () => {
    it('should return image dimensions', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: null as string | null,
        naturalWidth: 800,
        naturalHeight: 600,
        set src(value: string) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const result = await getAssetDimensions('https://example.com/image.png');
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('should reject on dimension load error', async () => {
      const mockImage = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        crossOrigin: null as string | null,
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        },
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      await expect(getAssetDimensions('https://example.com/invalid-image.png'))
        .rejects.toThrow('Failed to load asset for dimensions');
    });
  });
});