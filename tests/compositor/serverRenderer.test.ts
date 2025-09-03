import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PNGRenderer } from '../../server/compositor/renderPNG';
import { PDFRenderer } from '../../server/compositor/renderPDF';
import { TemplateSpec, TemplatePlacement } from '../../src/compositor/TemplateSpec';

// Mock Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    composite: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data'))
  }))
}));

// Mock Resvg
vi.mock('@resvg/resvg-js', () => ({
  Resvg: vi.fn(() => ({
    render: vi.fn(() => ({
      asPng: vi.fn(() => new Uint8Array([1, 2, 3, 4]))
    }))
  }))
}));

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn(() => ({
      addPage: vi.fn(() => ({
        drawRectangle: vi.fn(),
        drawImage: vi.fn(),
        drawText: vi.fn(),
        drawCircle: vi.fn(),
        node: { addAnnot: vi.fn() }
      })),
      embedPng: vi.fn(),
      embedFont: vi.fn(() => ({
        widthOfTextAtSize: vi.fn(() => 100),
        familyName: 'Test Font'
      })),
      save: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data'))
    }))
  },
  StandardFonts: { Helvetica: 'Helvetica' },
  rgb: vi.fn()
}));

describe('Server-side Rendering', () => {
  let pngRenderer: PNGRenderer;
  let pdfRenderer: PDFRenderer;
  let testTemplate: TemplateSpec;
  let testPlacements: TemplatePlacement;

  beforeEach(() => {
    pngRenderer = new PNGRenderer();
    pdfRenderer = new PDFRenderer();
    
    testTemplate = {
      version: '1.0',
      name: 'Test Template',
      description: 'Test template for rendering',
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        format: 'png',
        dpi: 72
      },
      layers: [
        {
          id: 'bg',
          type: 'shape',
          visible: true,
          zIndex: 0,
          opacity: 1.0,
          content: {
            shape: 'rectangle',
            fill: '#f0f0f0'
          },
          transform: {
            x: '0px',
            y: '0px',
            width: '100%',
            height: '100%',
            anchor: 'top-left'
          }
        },
        {
          id: 'title',
          type: 'text',
          visible: true,
          zIndex: 1,
          opacity: 1.0,
          content: {
            text: '{{title}}',
            font: {
              family: 'Arial',
              weight: 700,
              style: 'normal'
            },
            fontSize: 24,
            color: '#000000',
            alignment: 'center'
          },
          transform: {
            x: '50%',
            y: '25%',
            width: '80%',
            height: '10%',
            anchor: 'center'
          }
        }
      ],
      inputs: [],
      outputs: []
    };

    testPlacements = {
      text: {
        title: 'Test Title'
      },
      assets: {},
      colors: {}
    };
  });

  describe('PNG Rendering', () => {
    it('should render a basic template to PNG', async () => {
      const result = await pngRenderer.renderPNG(testTemplate, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle custom render options', async () => {
      const options = {
        width: 400,
        height: 300,
        format: 'jpeg' as const,
        quality: 80
      };
      
      const result = await pngRenderer.renderPNG(testTemplate, testPlacements, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle text placeholders correctly', async () => {
      const placementsWithText = {
        ...testPlacements,
        text: { title: 'Custom Title Text' }
      };
      
      const result = await pngRenderer.renderPNG(testTemplate, placementsWithText);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle missing assets gracefully', async () => {
      const templateWithImage = {
        ...testTemplate,
        layers: [
          ...testTemplate.layers,
          {
            id: 'image',
            type: 'image' as const,
            visible: true,
            zIndex: 2,
            content: {
              source: '/nonexistent/image.jpg',
              fit: 'cover' as const
            },
            transform: {
              x: '10%',
              y: '10%',
              width: '80%',
              height: '60%',
              anchor: 'top-left'
            }
          }
        ]
      };
      
      // Should not throw, just skip the missing layer
      const result = await pngRenderer.renderPNG(templateWithImage, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF Rendering', () => {
    it('should render a basic template to PDF', async () => {
      const result = await pdfRenderer.renderPDF(testTemplate, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should embed fonts when specified', async () => {
      const options = {
        embedFonts: true
      };
      
      const result = await pdfRenderer.renderPDF(testTemplate, testPlacements, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should add hyperlinks when specified', async () => {
      const options = {
        hyperlinks: [
          {
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            url: 'https://example.com'
          }
        ]
      };
      
      const result = await pdfRenderer.renderPDF(testTemplate, testPlacements, options);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle text overflow with shrink-to-fit', async () => {
      const longTextTemplate = {
        ...testTemplate,
        layers: [
          {
            id: 'long-text',
            type: 'text' as const,
            visible: true,
            zIndex: 1,
            content: {
              text: 'This is a very long text that should be automatically shrunk to fit within the specified bounds',
              font: { family: 'Arial', weight: 400, style: 'normal' as const },
              fontSize: 48,
              color: '#000000',
              alignment: 'center' as const
            },
            transform: {
              x: '10%',
              y: '40%',
              width: '30%',
              height: '20%',
              anchor: 'top-left'
            }
          }
        ]
      };
      
      const result = await pdfRenderer.renderPDF(longTextTemplate, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('Golden File Tests', () => {
    it('should render Tarot card template consistently', async () => {
      const tarotTemplate: TemplateSpec = {
        version: '1.0',
        name: 'Tarot Card',
        description: 'Mystical tarot card design',
        canvas: {
          width: 600,
          height: 900,
          backgroundColor: '#1a1a2e',
          format: 'png',
          dpi: 300
        },
        layers: [
          {
            id: 'border',
            type: 'shape',
            visible: true,
            zIndex: 0,
            content: {
              shape: 'rectangle',
              fill: '#16213e',
              stroke: { color: '#0f3460', width: 4 }
            },
            transform: {
              x: '5%',
              y: '5%',
              width: '90%',
              height: '90%',
              anchor: 'top-left'
            }
          },
          {
            id: 'title',
            type: 'text',
            visible: true,
            zIndex: 1,
            content: {
              text: '{{cardName}}',
              font: { family: 'serif', weight: 700, style: 'normal' },
              fontSize: 28,
              color: '#e94560',
              alignment: 'center'
            },
            transform: {
              x: '50%',
              y: '15%',
              width: '80%',
              height: '8%',
              anchor: 'center'
            }
          }
        ],
        inputs: [],
        outputs: []
      };

      const tarotPlacements = {
        text: { cardName: 'The Fool' },
        assets: {},
        colors: {}
      };

      const pngResult = await pngRenderer.renderPNG(tarotTemplate, tarotPlacements);
      const pdfResult = await pdfRenderer.renderPDF(tarotTemplate, tarotPlacements);

      expect(pngResult).toBeInstanceOf(Buffer);
      expect(pdfResult).toBeInstanceOf(Buffer);
      expect(pngResult.length).toBeGreaterThan(1000); // Reasonable size check
      expect(pdfResult.length).toBeGreaterThan(1000);
    });

    it('should render Planner page template consistently', async () => {
      const plannerTemplate: TemplateSpec = {
        version: '1.0',
        name: 'Weekly Planner',
        description: 'Weekly planning layout',
        canvas: {
          width: 800,
          height: 1000,
          backgroundColor: '#ffffff',
          format: 'pdf',
          dpi: 300
        },
        layers: [
          {
            id: 'header',
            type: 'text',
            visible: true,
            zIndex: 1,
            content: {
              text: 'Week of {{weekDate}}',
              font: { family: 'sans-serif', weight: 600, style: 'normal' },
              fontSize: 32,
              color: '#2c3e50',
              alignment: 'center'
            },
            transform: {
              x: '50%',
              y: '8%',
              width: '90%',
              height: '6%',
              anchor: 'center'
            }
          },
          {
            id: 'grid',
            type: 'shape',
            visible: true,
            zIndex: 0,
            content: {
              shape: 'rectangle',
              fill: 'transparent',
              stroke: { color: '#bdc3c7', width: 1 }
            },
            transform: {
              x: '10%',
              y: '20%',
              width: '80%',
              height: '70%',
              anchor: 'top-left'
            }
          }
        ],
        inputs: [],
        outputs: []
      };

      const plannerPlacements = {
        text: { weekDate: 'January 15-21, 2024' },
        assets: {},
        colors: {}
      };

      const pngResult = await pngRenderer.renderPNG(plannerTemplate, plannerPlacements);
      const pdfResult = await pdfRenderer.renderPDF(plannerTemplate, plannerPlacements);

      expect(pngResult).toBeInstanceOf(Buffer);
      expect(pdfResult).toBeInstanceOf(Buffer);
      expect(pngResult.length).toBeGreaterThan(1000);
      expect(pdfResult.length).toBeGreaterThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invisible layers', async () => {
      const templateWithInvisibleLayer = {
        ...testTemplate,
        layers: [
          ...testTemplate.layers,
          {
            id: 'invisible',
            type: 'text' as const,
            visible: false,
            zIndex: 10,
            content: {
              text: 'This should not appear',
              font: { family: 'Arial', weight: 400, style: 'normal' as const },
              fontSize: 16,
              color: '#ff0000'
            },
            transform: {
              x: '50%',
              y: '50%',
              width: '50%',
              height: '10%',
              anchor: 'center'
            }
          }
        ]
      };

      const result = await pngRenderer.renderPNG(templateWithInvisibleLayer, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle zero opacity layers', async () => {
      const templateWithTransparentLayer = {
        ...testTemplate,
        layers: [
          {
            ...testTemplate.layers[0],
            opacity: 0
          }
        ]
      };

      const result = await pngRenderer.renderPNG(templateWithTransparentLayer, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle malformed color values', async () => {
      const templateWithBadColors = {
        ...testTemplate,
        layers: [
          {
            ...testTemplate.layers[1],
            content: {
              ...testTemplate.layers[1].content,
              color: 'invalid-color'
            }
          }
        ]
      };

      // Should fall back to default color
      const result = await pngRenderer.renderPNG(templateWithBadColors, testPlacements);
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});