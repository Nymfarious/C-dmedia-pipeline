import { TemplateSpec, TemplatePlacement, RenderOptions } from './TemplateSpec';
import { Asset } from '@/types/media';

export class TemplateRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;
  }

  async render(
    template: TemplateSpec, 
    placement: TemplatePlacement, 
    options: RenderOptions = { format: 'png', quality: 95 }
  ): Promise<void> {
    const { canvas, ctx } = this;
    
    // Set canvas size
    canvas.width = template.canvas.width;
    canvas.height = template.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    if (template.canvas.backgroundColor) {
      ctx.fillStyle = template.canvas.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render layers in order
    for (const layer of template.layers) {
      if (!layer.visible) continue;
      
      // Check layer conditions
      if (!this.checkLayerConditions(layer, placement)) continue;
      
      await this.renderLayer(layer, template, placement);
    }
  }

  private async renderLayer(
    layer: any, 
    template: TemplateSpec, 
    placement: TemplatePlacement
  ): Promise<void> {
    const { ctx } = this;
    
    // Apply layer opacity
    const previousAlpha = ctx.globalAlpha;
    if (layer.opacity !== undefined) {
      ctx.globalAlpha = layer.opacity;
    }

    // Calculate position and size
    const position = this.calculatePosition(layer.transform, template.canvas);
    const size = this.calculateSize(layer.transform, template.canvas);

    try {
      switch (layer.type) {
        case 'shape':
          this.renderShape(layer, position, size, placement);
          break;
        case 'text':
          this.renderText(layer, position, size, placement);
          break;
        case 'image':
          await this.renderImage(layer, position, size, placement);
          break;
        case 'ai-image':
          await this.renderAIImage(layer, position, size, placement);
          break;
        case 'ai-text':
          this.renderAIText(layer, position, size, placement);
          break;
        default:
          console.warn(`Unsupported layer type: ${layer.type}`);
      }
    } catch (error) {
      console.error(`Error rendering layer ${layer.id}:`, error);
    }

    // Restore opacity
    ctx.globalAlpha = previousAlpha;
  }

  private renderShape(
    layer: any, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    placement: TemplatePlacement
  ): void {
    const { ctx } = this;
    const { content } = layer;

    ctx.save();

    if (content.fill) {
      ctx.fillStyle = this.resolveVariable(content.fill, placement);
    }

    if (content.stroke) {
      ctx.strokeStyle = this.resolveVariable(content.stroke, placement);
      ctx.lineWidth = content.strokeWidth || 1;
    }

    switch (content.type) {
      case 'rectangle':
        if (content.fill) {
          ctx.fillRect(position.x, position.y, size.width, size.height);
        }
        if (content.stroke) {
          ctx.strokeRect(position.x, position.y, size.width, size.height);
        }
        break;
      case 'circle':
        const radius = Math.min(size.width, size.height) / 2;
        const centerX = position.x + size.width / 2;
        const centerY = position.y + size.height / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (content.fill) {
          ctx.fill();
        }
        if (content.stroke) {
          ctx.stroke();
        }
        break;
      case 'polygon':
        if (content.points && content.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(position.x + content.points[0][0], position.y + content.points[0][1]);
          
          for (let i = 1; i < content.points.length; i++) {
            ctx.lineTo(position.x + content.points[i][0], position.y + content.points[i][1]);
          }
          
          ctx.closePath();
          
          if (content.fill) {
            ctx.fill();
          }
          if (content.stroke) {
            ctx.stroke();
          }
        }
        break;
    }

    ctx.restore();
  }

  private renderText(
    layer: any, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    placement: TemplatePlacement
  ): void {
    const { ctx } = this;
    const { content } = layer;
    
    ctx.save();

    // Get text content (replace variables)
    let text = this.resolveVariable(content.text || '', placement);

    // Set font
    const fontSize = content.font?.size || 16;
    const fontFamily = content.font?.family || 'sans-serif';
    const fontWeight = content.font?.weight || 'normal';
    const fontStyle = content.font?.style || 'normal';
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    
    // Resolve color variables
    const color = this.resolveVariable(content.color || '#000000', placement);
    ctx.fillStyle = color;
    ctx.textAlign = content.align || 'left';

    // Handle text transforms
    if (content.textTransform === 'uppercase') {
      text = text.toUpperCase();
    } else if (content.textTransform === 'lowercase') {
      text = text.toLowerCase();
    }

    // Calculate text position based on alignment
    let textX = position.x;
    let textY = position.y + fontSize; // Baseline adjustment

    if (content.align === 'center') {
      textX = position.x + size.width / 2;
    } else if (content.align === 'right') {
      textX = position.x + size.width;
    }

    // Handle multi-line text
    const lines = this.wrapText(text, size.width, ctx);
    const lineHeight = fontSize * (content.lineHeight || 1.2);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, textY + (index * lineHeight));
    });

    ctx.restore();
  }

  private async renderImage(
    layer: any, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    placement: TemplatePlacement
  ): Promise<void> {
    const { ctx } = this;
    const { content } = layer;
    
    // Get image source
    let imageSrc = content.source;
    if (imageSrc?.startsWith('$input.')) {
      const inputKey = imageSrc.substring(7); // Remove '$input.'
      const asset = placement.assets[inputKey];
      imageSrc = asset?.src;
    }

    if (!imageSrc) {
      // Draw placeholder
      ctx.save();
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(position.x, position.y, size.width, size.height);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(position.x, position.y, size.width, size.height);
      
      // Draw placeholder icon
      ctx.fillStyle = '#999';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Image', position.x + size.width / 2, position.y + size.height / 2);
      ctx.restore();
      return;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        // Apply filters if specified
        if (content.filters) {
          const filters = [];
          if (content.filters.brightness !== undefined) {
            filters.push(`brightness(${content.filters.brightness})`);
          }
          if (content.filters.contrast !== undefined) {
            filters.push(`contrast(${content.filters.contrast})`);
          }
          if (content.filters.saturation !== undefined) {
            filters.push(`saturate(${content.filters.saturation})`);
          }
          if (filters.length > 0) {
            ctx.filter = filters.join(' ');
          }
        }

        // Apply opacity
        if (content.opacity !== undefined) {
          ctx.globalAlpha = content.opacity;
        }

        // Calculate drawing dimensions based on fit mode
        const drawDimensions = this.calculateImageDimensions(
          img.width, 
          img.height, 
          size.width, 
          size.height, 
          content.fit || 'cover'
        );

        ctx.drawImage(
          img,
          position.x + drawDimensions.offsetX,
          position.y + drawDimensions.offsetY,
          drawDimensions.width,
          drawDimensions.height
        );

        ctx.restore();
        resolve();
      };

      img.onerror = () => {
        console.error('Failed to load image:', imageSrc);
        resolve();
      };

      img.src = imageSrc;
    });
  }

  private calculatePosition(transform: any, canvas: any): { x: number; y: number } {
    const x = typeof transform.position.x === 'string' 
      ? (parseFloat(transform.position.x.replace('%', '')) / 100) * canvas.width
      : transform.position.x;
    
    const y = typeof transform.position.y === 'string'
      ? (parseFloat(transform.position.y.replace('%', '')) / 100) * canvas.height
      : transform.position.y;

    return { x, y };
  }

  private calculateSize(transform: any, canvas: any): { width: number; height: number } {
    const width = typeof transform.size.width === 'string'
      ? (parseFloat(transform.size.width.replace('%', '')) / 100) * canvas.width
      : transform.size.width;
    
    const height = typeof transform.size.height === 'string'
      ? (parseFloat(transform.size.height.replace('%', '')) / 100) * canvas.height
      : transform.size.height;

    return { width, height };
  }

  private calculateImageDimensions(
    imgWidth: number, 
    imgHeight: number, 
    targetWidth: number, 
    targetHeight: number, 
    fit: string
  ): { width: number; height: number; offsetX: number; offsetY: number } {
    const imgAspect = imgWidth / imgHeight;
    const targetAspect = targetWidth / targetHeight;

    let width = targetWidth;
    let height = targetHeight;
    let offsetX = 0;
    let offsetY = 0;

    switch (fit) {
      case 'cover':
        if (imgAspect > targetAspect) {
          width = targetHeight * imgAspect;
          offsetX = (targetWidth - width) / 2;
        } else {
          height = targetWidth / imgAspect;
          offsetY = (targetHeight - height) / 2;
        }
        break;
      case 'contain':
        if (imgAspect > targetAspect) {
          height = targetWidth / imgAspect;
          offsetY = (targetHeight - height) / 2;
        } else {
          width = targetHeight * imgAspect;
          offsetX = (targetWidth - width) / 2;
        }
        break;
      case 'fill':
        // Use target dimensions as-is
        break;
    }

    return { width, height, offsetX, offsetY };
  }

  private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Enhanced variable resolution
  private resolveVariable(value: string, placement: TemplatePlacement): string {
    if (!value || typeof value !== 'string') return value;
    
    // Handle $input.variable_name references
    if (value.startsWith('$input.')) {
      const inputKey = value.substring(7);
      return placement.variables[inputKey] || value;
    }
    
    // Handle embedded variables in strings like "rgba($input.color, 0.5)"
    return value.replace(/\$input\.([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, inputKey) => {
      return placement.variables[inputKey] || match;
    });
  }

  // Check layer conditions (like hasValue)
  private checkLayerConditions(layer: any, placement: TemplatePlacement): boolean {
    if (!layer.conditions || !Array.isArray(layer.conditions)) return true;
    
    return layer.conditions.every((condition: any) => {
      switch (condition.type) {
        case 'hasValue':
          if (condition.reference?.startsWith('$input.')) {
            const inputKey = condition.reference.substring(7);
            const value = placement.variables[inputKey] || placement.assets[inputKey];
            return value !== undefined && value !== null && value !== '';
          }
          return true;
        default:
          return true;
      }
    });
  }

  private async renderAIImage(
    layer: any, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    placement: TemplatePlacement
  ): Promise<void> {
    const { ctx } = this;
    const { content } = layer;
    
    // Show loading placeholder during AI generation
    ctx.save();
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(position.x, position.y, size.width, size.height);
    ctx.strokeStyle = '#e9ecef';
    ctx.strokeRect(position.x, position.y, size.width, size.height);
    
    // Add loading icon
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generating...', position.x + size.width / 2, position.y + size.height / 2);
    ctx.restore();

    // If this is already processed (from backend), render the generated image
    if (layer.metadata?.aiGenerated && content.source) {
      await this.renderImage(layer, position, size, placement);
    }
  }

  private renderAIText(
    layer: any, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    placement: TemplatePlacement
  ): void {
    const { ctx } = this;
    const { content } = layer;
    
    // If this is already processed (from backend), render the generated text
    if (layer.metadata?.aiGenerated) {
      this.renderText(layer, position, size, placement);
    } else {
      // Show loading placeholder for AI text generation
      ctx.save();
      ctx.fillStyle = '#6c757d';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generating text...', position.x + size.width / 2, position.y + size.height / 2);
      ctx.restore();
    }
  }

  // Generate final asset from template (with AI integration)
  async generateAsset(template: TemplateSpec, placement: TemplatePlacement): Promise<Asset> {
    // Check if template has AI layers that need backend processing
    const hasAILayers = template.layers.some(layer => 
      layer.type === 'ai-image' || layer.type === 'ai-text'
    );

    if (hasAILayers) {
      // Use backend template composer for AI processing
      return this.generateAssetWithAI(template, placement);
    }

    // Standard template rendering for non-AI templates
    await this.render(template, placement);
    
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate image blob');
        }

        const asset: Asset = {
          id: `template_${Date.now()}`,
          type: 'image',
          name: `${template.name} - Generated`,
          src: URL.createObjectURL(blob),
          createdAt: Date.now(),
          category: 'generated',
          subcategory: 'templates',
          tags: ['template', template.category || 'general'],
          meta: {
            width: template.canvas.width,
            height: template.canvas.height,
            templateName: template.name
          }
        };

        resolve(asset);
      }, 'image/png');
    });
  }

  private async generateAssetWithAI(template: TemplateSpec, placement: TemplatePlacement): Promise<Asset> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      const { data, error } = await supabase.functions.invoke('template-composer', {
        body: {
          template,
          placement,
          options: {
            format: template.canvas.format || 'png',
            quality: 95
          }
        }
      });

      if (error) {
        throw new Error(`AI template generation failed: ${error.message}`);
      }

      if (!data?.output) {
        throw new Error('No output received from AI template generation');
      }

      return {
        id: `ai_template_${Date.now()}`,
        type: 'image',
        name: `${template.name} - AI Generated`,
        src: data.output,
        createdAt: Date.now(),
        category: 'generated',
        subcategory: 'ai-templates',
        tags: ['template', 'ai-generated', template.category || 'general'],
        meta: {
          width: data.metadata.width,
          height: data.metadata.height,
          templateName: template.name,
          aiLayersProcessed: data.metadata.aiLayersProcessed,
          processingTime: data.metadata.processingTime,
          aiGenerated: true
        }
      };
    } catch (error) {
      console.error('AI template generation error:', error);
      throw error;
    }
  }
}