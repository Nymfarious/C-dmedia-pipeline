import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderPNG, renderPDF } from '@/compositor/renderer';
import { mockTemplateSpec, mockPlacements, mockComplexTemplate, mockComplexPlacements } from '../fixtures/templates';
import { createMockCanvas } from '../mocks/canvas';

// Mock jsPDF
vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      addImage: vi.fn(),
      save: vi.fn(),
      output: vi.fn().mockReturnValue(new ArrayBuffer(1000)),
    })),
  };
});

// Mock document.createElement
beforeEach(() => {
  global.document.createElement = vi.fn().mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    }
    return {};
  });
});

describe('Renderer', () => {
  describe('renderPNG', () => {
    it('should render a simple template to PNG', async () => {
      const result = await renderPNG(mockTemplateSpec, mockPlacements);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should handle templates with different canvas sizes', async () => {
      const customTemplate = {
        ...mockTemplateSpec,
        canvas: {
          width: 1920,
          height: 1080,
          background: '#000000',
        },
      };
      
      const result = await renderPNG(customTemplate, mockPlacements);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should render complex template with gradients and blending', async () => {
      const result = await renderPNG(mockComplexTemplate, mockComplexPlacements);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should handle empty layers array', async () => {
      const emptyTemplate = {
        ...mockTemplateSpec,
        layers: [],
      };
      
      const result = await renderPNG(emptyTemplate, {});
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should apply custom render options', async () => {
      const options = {
        dpi: 300,
        quality: 0.9,
      };
      
      const result = await renderPNG(mockTemplateSpec, mockPlacements, options);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('renderPDF', () => {
    it('should render a template to PDF', async () => {
      const result = await renderPDF(mockTemplateSpec, mockPlacements);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should handle PDF rendering with custom options', async () => {
      const options = {
        format: 'a4' as const,
        orientation: 'portrait' as const,
      };
      
      const result = await renderPDF(mockTemplateSpec, mockPlacements, options);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('Layer Rendering', () => {
    it('should handle invisible layers', async () => {
      const templateWithInvisibleLayer = {
        ...mockTemplateSpec,
        layers: [
          ...mockTemplateSpec.layers,
          {
            id: 'invisible-layer',
            type: 'text' as const,
            name: 'Invisible Text',
            visible: false,
            opacity: 1,
            blendMode: 'normal' as const,
            zIndex: 10,
            transform: {
              x: 0,
              y: 0,
              width: 100,
              height: 50,
            },
            text: {
              content: 'This should not be rendered',
              font: { family: 'Arial', size: 16, weight: 'normal' as const },
              color: '#000000',
              align: 'left' as const,
              verticalAlign: 'top' as const,
            },
          },
        ],
      };
      
      const result = await renderPNG(templateWithInvisibleLayer, mockPlacements);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle layers with different opacity levels', async () => {
      const templateWithOpacity = {
        ...mockTemplateSpec,
        layers: mockTemplateSpec.layers.map(layer => ({
          ...layer,
          opacity: 0.5,
        })),
      };
      
      const result = await renderPNG(templateWithOpacity, mockPlacements);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle missing assets gracefully', async () => {
      const placementsWithMissingAsset = {
        title: 'Test Title',
        // asset_logo is missing
      };
      
      await expect(renderPNG(mockTemplateSpec, placementsWithMissingAsset))
        .rejects.toThrow();
    });
  });
});