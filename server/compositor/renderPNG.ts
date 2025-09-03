import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';
import { TemplateSpec, TemplatePlacement, RenderOptions, LayerSpec } from '../../src/compositor/TemplateSpec';
import { applyLayout } from './layoutEngine';
import { FontManager } from './fontManager';
import { AssetResolver } from './assetResolver';

export interface PNGRenderOptions extends RenderOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  dpi?: number;
}

export class PNGRenderer {
  private fontManager: FontManager;
  private assetResolver: AssetResolver;

  constructor() {
    this.fontManager = new FontManager();
    this.assetResolver = new AssetResolver();
  }

  async renderPNG(
    template: TemplateSpec, 
    placements: TemplatePlacement, 
    options: PNGRenderOptions = {}
  ): Promise<Buffer> {
    const { canvas } = template;
    const width = options.width || canvas.width;
    const height = options.height || canvas.height;
    const dpi = options.dpi || canvas.dpi || 72;

    // Create base canvas with background
    let baseImage = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: canvas.backgroundColor || { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // Sort layers by z-index
    const sortedLayers = [...template.layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Render each layer
    const layerBuffers: Buffer[] = [];
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      const layerBuffer = await this.renderLayer(layer, placements, width, height, dpi);
      if (layerBuffer) {
        layerBuffers.push(layerBuffer);
      }
    }

    // Composite all layers
    if (layerBuffers.length > 0) {
      baseImage = baseImage.composite(
        layerBuffers.map(buffer => ({ input: buffer }))
      );
    }

    // Apply final output options
    const format = options.format || 'png';
    const quality = options.quality || 90;

    switch (format) {
      case 'jpeg':
        return baseImage.jpeg({ quality }).toBuffer();
      case 'webp':
        return baseImage.webp({ quality }).toBuffer();
      default:
        return baseImage.png().toBuffer();
    }
  }

  private async renderLayer(
    layer: LayerSpec,
    placements: TemplatePlacement,
    canvasWidth: number,
    canvasHeight: number,
    dpi: number
  ): Promise<Buffer | null> {
    const layout = applyLayout(layer, canvasWidth, canvasHeight);

    switch (layer.type) {
      case 'image':
        return this.renderImageLayer(layer, layout, dpi);
      case 'text':
        return this.renderTextLayer(layer, layout, placements, dpi);
      case 'shape':
        return this.renderShapeLayer(layer, layout);
      default:
        return null;
    }
  }

  private async renderImageLayer(layer: LayerSpec, layout: any, dpi: number): Promise<Buffer | null> {
    try {
      const content = layer.content as any;
      const assetBuffer = await this.assetResolver.resolveAsset(content.source);
      
      if (!assetBuffer) return null;

      // Handle SVG with resvg
      if (content.source.toLowerCase().includes('.svg')) {
        const resvg = new Resvg(assetBuffer, {
          dpi,
          fitTo: {
            mode: 'width',
            value: layout.width
          }
        });
        const pngData = resvg.render();
        return Buffer.from(pngData.asPng());
      }

      // Handle regular images with sharp
      return sharp(assetBuffer)
        .resize(layout.width, layout.height, {
          fit: content.fit || 'cover',
          position: content.position || 'center'
        })
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Error rendering image layer:', error);
      return null;
    }
  }

  private async renderTextLayer(
    layer: LayerSpec,
    layout: any,
    placements: TemplatePlacement,
    dpi: number
  ): Promise<Buffer | null> {
    try {
      const content = layer.content as any;
      const text = this.resolveTextPlaceholders(content.text, placements);
      
      if (!text) return null;

      // Load font
      const font = await this.fontManager.loadFont(content.font);
      
      // Create text image using SVG then convert to PNG
      const svg = this.createTextSVG(text, content, layout, font);
      const resvg = new Resvg(Buffer.from(svg), { dpi });
      const pngData = resvg.render();
      
      return Buffer.from(pngData.asPng());
    } catch (error) {
      console.error('Error rendering text layer:', error);
      return null;
    }
  }

  private async renderShapeLayer(layer: LayerSpec, layout: any): Promise<Buffer | null> {
    try {
      const content = layer.content as any;
      
      // Create shape SVG then convert to PNG
      const svg = this.createShapeSVG(content, layout);
      const resvg = new Resvg(Buffer.from(svg));
      const pngData = resvg.render();
      
      return Buffer.from(pngData.asPng());
    } catch (error) {
      console.error('Error rendering shape layer:', error);
      return null;
    }
  }

  private createTextSVG(text: string, content: any, layout: any, font: any): string {
    const fontSize = content.fontSize || 16;
    const color = content.color || '#000000';
    const textAnchor = content.alignment === 'center' ? 'middle' : 
                     content.alignment === 'right' ? 'end' : 'start';
    
    return `
      <svg width="${layout.width}" height="${layout.height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${layout.width / 2}" y="${layout.height / 2}" 
              font-family="${font.familyName}" 
              font-size="${fontSize}" 
              fill="${color}" 
              text-anchor="${textAnchor}"
              dominant-baseline="central">
          ${text}
        </text>
      </svg>
    `;
  }

  private createShapeSVG(content: any, layout: any): string {
    const fill = content.fill || '#000000';
    const stroke = content.stroke?.color || 'none';
    const strokeWidth = content.stroke?.width || 0;

    switch (content.shape) {
      case 'rectangle':
        return `
          <svg width="${layout.width}" height="${layout.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${layout.width}" height="${layout.height}" 
                  fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          </svg>
        `;
      case 'circle':
        const radius = Math.min(layout.width, layout.height) / 2;
        return `
          <svg width="${layout.width}" height="${layout.height}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${layout.width / 2}" cy="${layout.height / 2}" r="${radius}" 
                    fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          </svg>
        `;
      default:
        return `<svg width="${layout.width}" height="${layout.height}" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
  }

  private resolveTextPlaceholders(text: string, placements: TemplatePlacement): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return placements.text?.[key] || match;
    });
  }
}