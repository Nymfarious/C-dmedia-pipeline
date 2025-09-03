import { TextLayerContent, FontSpec } from './TemplateSpec';
import { getFontString } from './fontLoader';

export function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  content: TextLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): void {
  // Set font
  ctx.font = getFontString(content.font);
  ctx.fillStyle = content.color;
  
  // Handle text alignment
  ctx.textAlign = content.alignment === 'center' ? 'center' : 
                  content.alignment === 'right' ? 'end' : 'start';
  ctx.textBaseline = 'top';

  // Apply letter spacing if specified
  if (content.letterSpacing) {
    ctx.letterSpacing = `${content.letterSpacing}px`;
  }

  // Handle shrink-to-fit
  if (content.shrinkToFit) {
    const { finalText, finalFont } = shrinkTextToFit(
      ctx,
      text,
      content,
      layout.width,
      layout.height
    );
    ctx.font = finalFont;
    renderTextLines(ctx, finalText, content, layout);
  } else {
    renderTextLines(ctx, text, content, layout);
  }
}

function shrinkTextToFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  content: TextLayerContent,
  maxWidth: number,
  maxHeight: number
): { finalText: string; finalFont: string } {
  let fontSize = content.font.size;
  let finalText = text;
  let finalFont = getFontString(content.font);

  // Binary search for optimal font size
  let minSize = 8;
  let maxSize = fontSize;
  
  while (maxSize - minSize > 1) {
    const testSize = Math.floor((minSize + maxSize) / 2);
    const testFont = getFontString({ ...content.font, size: testSize });
    ctx.font = testFont;
    
    const lines = wrapText(ctx, text, maxWidth, content.maxLines);
    const textHeight = lines.length * testSize * (content.lineHeight || 1.2);
    
    if (textHeight <= maxHeight && lines.every(line => ctx.measureText(line).width <= maxWidth)) {
      minSize = testSize;
      finalFont = testFont;
      finalText = lines.join('\n');
    } else {
      maxSize = testSize;
    }
  }

  return { finalText, finalFont };
}

function renderTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  content: TextLayerContent,
  layout: { x: number; y: number; width: number; height: number }
): void {
  const lines = text.split('\n');
  const lineHeight = content.font.size * (content.lineHeight || 1.2);
  
  // Calculate starting Y position based on vertical alignment
  let startY = layout.y;
  const totalTextHeight = lines.length * lineHeight;
  
  if (totalTextHeight < layout.height) {
    // Center vertically if text is smaller than available space
    startY = layout.y + (layout.height - totalTextHeight) / 2;
  }

  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight);
    let x = layout.x;
    
    // Calculate X position based on alignment
    switch (content.alignment) {
      case 'center':
        x = layout.x + layout.width / 2;
        break;
      case 'right':
        x = layout.x + layout.width;
        break;
      case 'left':
      default:
        x = layout.x;
        break;
    }

    ctx.fillText(line, x, y);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      
      // Stop if we've reached max lines
      if (maxLines && lines.length >= maxLines) {
        break;
      }
    }
  }
  
  lines.push(currentLine);
  
  // Truncate to max lines if specified
  if (maxLines && lines.length > maxLines) {
    lines.splice(maxLines);
    // Add ellipsis to last line if truncated
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      const ellipsis = '...';
      const maxLineWidth = maxWidth - ctx.measureText(ellipsis).width;
      
      // Trim last line to fit ellipsis
      let trimmedLine = lastLine;
      while (ctx.measureText(trimmedLine).width > maxLineWidth && trimmedLine.length > 0) {
        trimmedLine = trimmedLine.slice(0, -1);
      }
      
      lines[lines.length - 1] = trimmedLine + ellipsis;
    }
  }
  
  return lines;
}

export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: FontSpec,
  maxWidth?: number
): { width: number; height: number } {
  const originalFont = ctx.font;
  ctx.font = getFontString(font);
  
  let lines: string[];
  if (maxWidth) {
    lines = wrapText(ctx, text, maxWidth);
  } else {
    lines = text.split('\n');
  }
  
  const width = Math.max(...lines.map(line => ctx.measureText(line).width));
  const height = lines.length * font.size * 1.2; // Default line height
  
  ctx.font = originalFont;
  
  return { width, height };
}