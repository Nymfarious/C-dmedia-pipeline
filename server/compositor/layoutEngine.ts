import { LayerSpec } from '../../src/compositor/TemplateSpec';

export interface LayoutResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export function applyLayout(
  layer: LayerSpec,
  canvasWidth: number,
  canvasHeight: number
): LayoutResult {
  const transform = layer.transform || {};
  
  // Convert units to pixels
  const x = convertUnit(transform.x || '0px', canvasWidth);
  const y = convertUnit(transform.y || '0px', canvasHeight);
  const width = convertUnit(transform.width || '100px', canvasWidth);
  const height = convertUnit(transform.height || '100px', canvasHeight);
  
  // Apply anchor point adjustments
  const { adjustedX, adjustedY } = applyAnchor(
    x, y, width, height, 
    transform.anchor || 'top-left',
    canvasWidth, canvasHeight
  );
  
  // Apply scale
  const scaleX = transform.scaleX || 1;
  const scaleY = transform.scaleY || 1;
  const scaledWidth = width * scaleX;
  const scaledHeight = height * scaleY;
  
  return {
    x: adjustedX,
    y: adjustedY,
    width: scaledWidth,
    height: scaledHeight,
    rotation: transform.rotation || 0,
    scaleX,
    scaleY
  };
}

function convertUnit(value: string | number, referenceSize: number): number {
  if (typeof value === 'number') return value;
  
  if (value.endsWith('%')) {
    const percentage = parseFloat(value.slice(0, -1));
    return (percentage / 100) * referenceSize;
  }
  
  if (value.endsWith('px')) {
    return parseFloat(value.slice(0, -2));
  }
  
  // Default to pixel value
  return parseFloat(value) || 0;
}

function applyAnchor(
  x: number,
  y: number,
  width: number,
  height: number,
  anchor: string,
  canvasWidth: number,
  canvasHeight: number
): { adjustedX: number; adjustedY: number } {
  let adjustedX = x;
  let adjustedY = y;
  
  // Handle percentage-based positioning relative to canvas
  if (anchor.includes('center')) {
    if (anchor.includes('center-')) {
      adjustedX = x - width / 2;
    }
    if (anchor.includes('-center') || anchor === 'center') {
      adjustedY = y - height / 2;
    }
  }
  
  if (anchor.includes('right')) {
    adjustedX = x - width;
  }
  
  if (anchor.includes('bottom')) {
    adjustedY = y - height;
  }
  
  // Handle special anchor values
  switch (anchor) {
    case 'center':
      adjustedX = x - width / 2;
      adjustedY = y - height / 2;
      break;
    case 'top-center':
      adjustedX = x - width / 2;
      break;
    case 'bottom-center':
      adjustedX = x - width / 2;
      adjustedY = y - height;
      break;
    case 'center-left':
      adjustedY = y - height / 2;
      break;
    case 'center-right':
      adjustedX = x - width;
      adjustedY = y - height / 2;
      break;
    case 'top-right':
      adjustedX = x - width;
      break;
    case 'bottom-left':
      adjustedY = y - height;
      break;
    case 'bottom-right':
      adjustedX = x - width;
      adjustedY = y - height;
      break;
  }
  
  return { adjustedX, adjustedY };
}

export function calculateBoundingBox(
  layers: LayerSpec[],
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  if (layers.length === 0) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const layer of layers) {
    if (!layer.visible) continue;
    
    const layout = applyLayout(layer, canvasWidth, canvasHeight);
    
    minX = Math.min(minX, layout.x);
    minY = Math.min(minY, layout.y);
    maxX = Math.max(maxX, layout.x + layout.width);
    maxY = Math.max(maxY, layout.y + layout.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function isPointInLayer(
  point: { x: number; y: number },
  layer: LayerSpec,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const layout = applyLayout(layer, canvasWidth, canvasHeight);
  
  return point.x >= layout.x &&
         point.x <= layout.x + layout.width &&
         point.y >= layout.y &&
         point.y <= layout.y + layout.height;
}