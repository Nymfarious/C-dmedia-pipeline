/**
 * Mask normalization utilities to ensure consistent mask semantics
 * White = edit area, Black = preserve area
 */

export interface MaskNormalizationOptions {
  pad?: number;
  feather?: number;
}

/**
 * Normalize mask to white edits (white = edit, black = preserve)
 * Adds padding and feathering to avoid seams
 */
export function normalizeMaskToWhiteEdits(
  src: HTMLCanvasElement,
  { pad = 12, feather = 3 }: MaskNormalizationOptions = {}
): HTMLCanvasElement {
  console.log('🎨 Normalizing mask with pad:', pad, 'feather:', feather);
  
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d")!;

  // Start with black background (preserve areas)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, out.width, out.height);

  // Draw painted strokes (assume brush draws opaque white to src)
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(src, 0, 0);

  // Apply padding (dilate) via shadow trick
  if (pad > 0) {
    const buf = document.createElement("canvas");
    buf.width = out.width;
    buf.height = out.height;
    const bctx = buf.getContext("2d")!;
    bctx.filter = `blur(${pad}px)`;
    bctx.drawImage(out, 0, 0);
    ctx.clearRect(0, 0, out.width, out.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(buf, 0, 0);
  }

  // Apply feathering (blur edges lightly)
  if (feather > 0) {
    const buf = document.createElement("canvas");
    buf.width = out.width;
    buf.height = out.height;
    const bctx = buf.getContext("2d")!;
    bctx.filter = `blur(${feather}px)`;
    bctx.drawImage(out, 0, 0);
    ctx.clearRect(0, 0, out.width, out.height);
    ctx.drawImage(buf, 0, 0);
  }

  // Ensure hard black/white (avoid semi-transparent background)
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i]; // red channel after blur
    if (v > 8) {
      // Edit area: pure white
      d[i] = 255;     // R
      d[i + 1] = 255; // G
      d[i + 2] = 255; // B
      d[i + 3] = 255; // A
    } else {
      // Preserve area: pure black
      d[i] = 0;       // R
      d[i + 1] = 0;   // G
      d[i + 2] = 0;   // B
      d[i + 3] = 255; // A (opaque)
    }
  }
  
  ctx.putImageData(img, 0, 0);
  console.log('✅ Mask normalized to white edits');
  
  return out;
}

/**
 * Convert canvas to data URL with validation
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (!dataUrl || dataUrl === 'data:,') {
      throw new Error('Failed to generate valid data URL from canvas');
    }
    return dataUrl;
  } catch (error) {
    console.error('❌ Failed to convert canvas to data URL:', error);
    throw new Error('Canvas to data URL conversion failed');
  }
}

/**
 * Convert canvas to blob with validation  
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate valid blob from canvas'));
        }
      },
      'image/png',
      1.0
    );
  });
}