import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { TemplateSpec, TemplatePlacement, RenderOptions, LayerSpec } from '../../src/compositor/TemplateSpec';
import { applyLayout } from './layoutEngine';
import { FontManager } from './fontManager';
import { AssetResolver } from './assetResolver';
import { PNGRenderer } from './renderPNG';

export interface PDFRenderOptions extends RenderOptions {
  embedFonts?: boolean;
  hyperlinks?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    url: string;
  }>;
}

export class PDFRenderer {
  private fontManager: FontManager;
  private assetResolver: AssetResolver;
  private pngRenderer: PNGRenderer;

  constructor() {
    this.fontManager = new FontManager();
    this.assetResolver = new AssetResolver();
    this.pngRenderer = new PNGRenderer();
  }

  async renderPDF(
    template: TemplateSpec,
    placements: TemplatePlacement,
    options: PDFRenderOptions = {}
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const { canvas } = template;
    
    // Convert points to PDF units (72 DPI)
    const width = canvas.width * 72 / (canvas.dpi || 72);
    const height = canvas.height * 72 / (canvas.dpi || 72);
    
    const page = pdfDoc.addPage([width, height]);
    
    // Set background color
    if (canvas.backgroundColor) {
      const bgColor = this.parseColor(canvas.backgroundColor);
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: bgColor
      });
    }

    // Sort layers by z-index
    const sortedLayers = [...template.layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Render each layer
    for (const layer of sortedLayers) {
      if (!layer.visible) continue;
      await this.renderLayer(layer, placements, page, pdfDoc, width, height, options);
    }

    // Add hyperlinks if specified
    if (options.hyperlinks) {
      for (const link of options.hyperlinks) {
        page.node.addAnnot(pdfDoc.context.register(
          pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [link.x, height - link.y - link.height, link.x + link.width, height - link.y],
            A: { Type: 'Action', S: 'URI', URI: link.url }
          })
        ));
      }
    }

    return pdfDoc.save();
  }

  private async renderLayer(
    layer: LayerSpec,
    placements: TemplatePlacement,
    page: PDFPage,
    pdfDoc: PDFDocument,
    pageWidth: number,
    pageHeight: number,
    options: PDFRenderOptions
  ): Promise<void> {
    const layout = applyLayout(layer, pageWidth, pageHeight);

    switch (layer.type) {
      case 'image':
        await this.renderImageLayer(layer, layout, page, pdfDoc, pageHeight);
        break;
      case 'text':
        await this.renderTextLayer(layer, layout, placements, page, pdfDoc, pageHeight, options);
        break;
      case 'shape':
        this.renderShapeLayer(layer, layout, page, pageHeight);
        break;
    }
  }

  private async renderImageLayer(
    layer: LayerSpec,
    layout: any,
    page: PDFPage,
    pdfDoc: PDFDocument,
    pageHeight: number
  ): Promise<void> {
    try {
      const content = layer.content as any;
      const assetBuffer = await this.assetResolver.resolveAsset(content.source);
      
      if (!assetBuffer) return;

      // Convert image to PNG for PDF embedding
      const pngBuffer = await this.pngRenderer.renderImageLayer(layer, layout, 72);
      if (!pngBuffer) return;

      const pdfImage = await pdfDoc.embedPng(pngBuffer);
      
      page.drawImage(pdfImage, {
        x: layout.x,
        y: pageHeight - layout.y - layout.height, // PDF coordinates are bottom-up
        width: layout.width,
        height: layout.height,
        opacity: layer.opacity || 1.0
      });
    } catch (error) {
      console.error('Error rendering image layer to PDF:', error);
    }
  }

  private async renderTextLayer(
    layer: LayerSpec,
    layout: any,
    placements: TemplatePlacement,
    page: PDFPage,
    pdfDoc: PDFDocument,
    pageHeight: number,
    options: PDFRenderOptions
  ): Promise<void> {
    try {
      const content = layer.content as any;
      const text = this.resolveTextPlaceholders(content.text, placements);
      
      if (!text) return;

      // Load or embed font
      let font: PDFFont;
      if (options.embedFonts && content.font) {
        const fontBuffer = await this.fontManager.getFontBuffer(content.font);
        if (fontBuffer) {
          font = await pdfDoc.embedFont(fontBuffer);
        } else {
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
      } else {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      const fontSize = content.fontSize || 16;
      const color = this.parseColor(content.color || '#000000');
      
      // Calculate text position based on alignment
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let x = layout.x;
      
      switch (content.alignment) {
        case 'center':
          x = layout.x + (layout.width - textWidth) / 2;
          break;
        case 'right':
          x = layout.x + layout.width - textWidth;
          break;
      }

      // Handle text overflow with shrink-to-fit
      let adjustedFontSize = fontSize;
      let adjustedText = text;
      
      if (textWidth > layout.width) {
        // Shrink font to fit
        adjustedFontSize = fontSize * (layout.width / textWidth);
        
        // If still too small, truncate text
        if (adjustedFontSize < fontSize * 0.5) {
          adjustedFontSize = fontSize * 0.5;
          const maxChars = Math.floor(layout.width / font.widthOfTextAtSize('W', adjustedFontSize));
          adjustedText = text.substring(0, maxChars - 3) + '...';
        }
      }

      page.drawText(adjustedText, {
        x,
        y: pageHeight - layout.y - layout.height / 2, // Center vertically
        size: adjustedFontSize,
        font,
        color,
        opacity: layer.opacity || 1.0
      });
    } catch (error) {
      console.error('Error rendering text layer to PDF:', error);
    }
  }

  private renderShapeLayer(
    layer: LayerSpec,
    layout: any,
    page: PDFPage,
    pageHeight: number
  ): void {
    try {
      const content = layer.content as any;
      const fillColor = this.parseColor(content.fill || '#000000');
      const strokeColor = content.stroke?.color ? this.parseColor(content.stroke.color) : undefined;
      const borderWidth = content.stroke?.width || 0;

      const y = pageHeight - layout.y - layout.height; // PDF coordinates are bottom-up

      switch (content.shape) {
        case 'rectangle':
          page.drawRectangle({
            x: layout.x,
            y,
            width: layout.width,
            height: layout.height,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth,
            opacity: layer.opacity || 1.0
          });
          break;
        case 'circle':
          const radius = Math.min(layout.width, layout.height) / 2;
          page.drawCircle({
            x: layout.x + layout.width / 2,
            y: y + layout.height / 2,
            size: radius,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth,
            opacity: layer.opacity || 1.0
          });
          break;
      }
    } catch (error) {
      console.error('Error rendering shape layer to PDF:', error);
    }
  }

  private parseColor(colorString: string) {
    // Handle hex colors
    if (colorString.startsWith('#')) {
      const hex = colorString.substring(1);
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    
    // Default to black
    return rgb(0, 0, 0);
  }

  private resolveTextPlaceholders(text: string, placements: TemplatePlacement): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return placements.text?.[key] || match;
    });
  }
}