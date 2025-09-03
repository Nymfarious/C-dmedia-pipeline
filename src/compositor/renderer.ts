import { TemplateSpec, TemplatePlacement, RenderOptions, LayerSpec, ImageLayerContent, TextLayerContent, ShapeLayerContent } from './TemplateSpec';
import { loadFont } from './fontLoader';
import { resolveAsset } from './assetResolver';
import { applyLayout } from './layoutEngine';
import { renderText } from './textEngine';
import { applyMask } from './maskEngine';

export async function renderPNG(
  template: TemplateSpec,
  placements: TemplatePlacement,
  options: RenderOptions = { format: 'png' }
): Promise<ArrayBuffer> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas size
  canvas.width = template.canvas.width;
  canvas.height = template.canvas.height;

  // Set background
  if (template.canvas.backgroundColor) {
    ctx.fillStyle = template.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Sort layers by z-index if specified
  const sortedLayers = [...template.layers].sort((a, b) => {
    const aZ = (a as any).zIndex || 0;
    const bZ = (b as any).zIndex || 0;
    return aZ - bZ;
  });

  // Render each layer
  for (const layer of sortedLayers) {
    if (layer.visible === false) continue;

    await renderLayer(ctx, layer, placements, template.canvas.width, template.canvas.height);
  }

  // Convert to desired format
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to render canvas'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Unexpected result type'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    }, `image/${options.format}`, options.quality || 0.9);
  });
}

export async function renderPDF(
  template: TemplateSpec,
  placements: TemplatePlacement,
  options: RenderOptions = { format: 'pdf' }
): Promise<ArrayBuffer> {
  // For PDF rendering, we'll use jsPDF with the PNG as an image
  // This is a simplified approach - full PDF rendering would require more complex layout
  const { jsPDF } = await import('jspdf');
  
  const pngBuffer = await renderPNG(template, placements, { format: 'png' });
  const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
  const pngUrl = URL.createObjectURL(pngBlob);
  
  const pdf = new jsPDF({
    orientation: template.canvas.width > template.canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [template.canvas.width, template.canvas.height]
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      pdf.addImage(img, 'PNG', 0, 0, template.canvas.width, template.canvas.height);
      
      // If embedFonts is true, we would embed fonts here
      // For now, we'll use the default PDF fonts
      
      const pdfBuffer = pdf.output('arraybuffer');
      URL.revokeObjectURL(pngUrl);
      resolve(pdfBuffer);
    };
    img.onerror = () => {
      URL.revokeObjectURL(pngUrl);
      reject(new Error('Failed to load rendered image'));
    };
    img.src = pngUrl;
  });
}

async function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: LayerSpec,
  placements: TemplatePlacement,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  // Save context for transformations
  ctx.save();

  // Apply opacity
  if (layer.opacity !== undefined) {
    ctx.globalAlpha = layer.opacity;
  }

  // Apply blend mode
  if (layer.blendMode && layer.blendMode !== 'normal') {
    ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
  }

  // Calculate layout
  const layout = applyLayout(layer, canvasWidth, canvasHeight);

  // Apply transforms
  if (layer.transform) {
    const { x, y, rotation, scaleX = 1, scaleY = 1 } = layer.transform;
    
    ctx.translate(x + layout.width / 2, y + layout.height / 2);
    
    if (rotation) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }
    
    ctx.translate(-layout.width / 2, -layout.height / 2);
  }

  // Render based on layer type
  switch (layer.type) {
    case 'image':
      await renderImageLayer(ctx, layer.content as ImageLayerContent, layout, placements);
      break;
    case 'text':
      await renderTextLayer(ctx, layer.content as TextLayerContent, layout, placements);
      break;
    case 'shape':
      await renderShapeLayer(ctx, layer.content as ShapeLayerContent, layout);
      break;
    case 'mask':
      // Masks are applied to subsequent layers, not rendered directly
      break;
  }

  // Restore context
  ctx.restore();
}

async function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  content: ImageLayerContent,
  layout: { x: number; y: number; width: number; height: number },
  placements: TemplatePlacement
): Promise<void> {
  const imageUrl = await resolveAsset(content.source, placements);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Apply fit mode
      const { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } = calculateImageFit(
        img.width,
        img.height,
        layout.width,
        layout.height,
        content.fitMode,
        content.crop
      );

      ctx.drawImage(img, sx, sy, sWidth, sHeight, layout.x + dx, layout.y + dy, dWidth, dHeight);
      resolve();
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

async function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  content: TextLayerContent,
  layout: { x: number; y: number; width: number; height: number },
  placements: TemplatePlacement
): Promise<void> {
  // Load font if needed
  await loadFont(content.font);
  
  // Resolve text placeholders
  const text = resolveTextPlaceholders(content.text, placements);
  
  // Render text with proper fitting
  renderText(ctx, text, content, layout);
}

async function renderShapeLayer(
  ctx: CanvasRenderingContext2D,
  content: ShapeLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): Promise<void> {
  ctx.beginPath();

  switch (content.shape) {
    case 'rectangle':
      ctx.rect(layout.x, layout.y, layout.width, layout.height);
      break;
    case 'circle':
      const centerX = layout.x + layout.width / 2;
      const centerY = layout.y + layout.height / 2;
      const radius = Math.min(layout.width, layout.height) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      break;
    case 'path':
      if (content.path) {
        const path = new Path2D(content.path);
        ctx.fill(path);
        ctx.stroke(path);
      }
      break;
  }

  // Fill
  if (content.fill) {
    ctx.fillStyle = content.fill;
    ctx.fill();
  }

  // Stroke
  if (content.stroke) {
    ctx.strokeStyle = content.stroke.color;
    ctx.lineWidth = content.stroke.width;
    if (content.stroke.dashArray) {
      ctx.setLineDash(content.stroke.dashArray);
    }
    ctx.stroke();
  }
}

function calculateImageFit(
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: string,
  crop?: any
) {
  const imgAspect = imgWidth / imgHeight;
  const targetAspect = targetWidth / targetHeight;

  let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;
  let dx = 0, dy = 0, dWidth = targetWidth, dHeight = targetHeight;

  switch (fitMode) {
    case 'cover':
      if (imgAspect > targetAspect) {
        sWidth = imgHeight * targetAspect;
        sx = (imgWidth - sWidth) / 2;
      } else {
        sHeight = imgWidth / targetAspect;
        sy = (imgHeight - sHeight) / 2;
      }
      break;
    case 'contain':
      if (imgAspect > targetAspect) {
        dHeight = targetWidth / imgAspect;
        dy = (targetHeight - dHeight) / 2;
      } else {
        dWidth = targetHeight * imgAspect;
        dx = (targetWidth - dWidth) / 2;
      }
      break;
    case 'fill':
      // Default behavior - stretch to fill
      break;
    case 'crop':
      if (crop) {
        sx = crop.x;
        sy = crop.y;
        sWidth = crop.width;
        sHeight = crop.height;
      }
      break;
  }

  return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight };
}

function resolveTextPlaceholders(text: string, placements: TemplatePlacement): string {
  return text.replace(/\${(\w+)}/g, (match, key) => {
    return placements[key] !== undefined ? String(placements[key]) : match;
  });
}