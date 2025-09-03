import { LayerSpec, TransformSpec, AnchorPoint } from './TemplateSpec';

export interface LayoutResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function applyLayout(
  layer: LayerSpec,
  canvasWidth: number,
  canvasHeight: number
): LayoutResult {
  if (!layer.transform) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }

  const transform = layer.transform;
  let { x, y, width, height } = transform;

  // Convert percentage values to pixels
  x = convertUnit(x, canvasWidth);
  y = convertUnit(y, canvasHeight);
  width = convertUnit(width, canvasWidth);
  height = convertUnit(height, canvasHeight);

  // Apply anchor positioning
  if (transform.anchor && transform.anchor !== 'top-left') {
    const anchored = applyAnchor(x, y, width, height, transform.anchor, canvasWidth, canvasHeight);
    x = anchored.x;
    y = anchored.y;
  }

  // Apply scaling
  if (transform.scaleX !== undefined && transform.scaleX !== 1) {
    width *= transform.scaleX;
  }
  if (transform.scaleY !== undefined && transform.scaleY !== 1) {
    height *= transform.scaleY;
  }

  return { x, y, width, height };
}

function convertUnit(value: number | string, referenceSize: number): number {
  if (typeof value === 'string') {
    if (value.endsWith('%')) {
      const percentage = parseFloat(value.slice(0, -1));
      return (percentage / 100) * referenceSize;
    }
    if (value.endsWith('px')) {
      return parseFloat(value.slice(0, -2));
    }
    return parseFloat(value);
  }
  return value;
}

function applyAnchor(
  x: number,
  y: number,
  width: number,
  height: number,
  anchor: AnchorPoint,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  let newX = x;
  let newY = y;

  switch (anchor) {
    case 'center':
      newX = (canvasWidth - width) / 2;
      newY = (canvasHeight - height) / 2;
      break;
    case 'top-center':
      newX = (canvasWidth - width) / 2;
      newY = y;
      break;
    case 'top-right':
      newX = canvasWidth - width - x;
      newY = y;
      break;
    case 'center-left':
      newX = x;
      newY = (canvasHeight - height) / 2;
      break;
    case 'center-right':
      newX = canvasWidth - width - x;
      newY = (canvasHeight - height) / 2;
      break;
    case 'bottom-left':
      newX = x;
      newY = canvasHeight - height - y;
      break;
    case 'bottom-center':
      newX = (canvasWidth - width) / 2;
      newY = canvasHeight - height - y;
      break;
    case 'bottom-right':
      newX = canvasWidth - width - x;
      newY = canvasHeight - height - y;
      break;
    case 'top-left':
    default:
      // No change needed
      break;
  }

  return { x: newX, y: newY };
}

export function calculateBoundingBox(layers: LayerSpec[], canvasWidth: number, canvasHeight: number) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layers.forEach(layer => {
    if (layer.visible === false) return;

    const layout = applyLayout(layer, canvasWidth, canvasHeight);
    
    minX = Math.min(minX, layout.x);
    minY = Math.min(minY, layout.y);
    maxX = Math.max(maxX, layout.x + layout.width);
    maxY = Math.max(maxY, layout.y + layout.height);
  });

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
  
  return (
    point.x >= layout.x &&
    point.x <= layout.x + layout.width &&
    point.y >= layout.y &&
    point.y <= layout.y + layout.height
  );
}