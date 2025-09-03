export interface TemplateSpec {
  version: string;
  name: string;
  description?: string;
  canvas: CanvasSpec;
  layers: LayerSpec[];
  metadata?: Record<string, any>;
}

export interface CanvasSpec {
  width: number;
  height: number;
  backgroundColor?: string;
  format?: 'png' | 'pdf' | 'webp';
  dpi?: number;
}

export interface LayerSpec {
  id: string;
  type: 'image' | 'text' | 'shape' | 'mask';
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  transform?: TransformSpec;
  content: ImageLayerContent | TextLayerContent | ShapeLayerContent | MaskLayerContent;
}

export interface TransformSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  anchor?: AnchorPoint;
}

export interface ImageLayerContent {
  source: string; // URL or asset reference like $asset_id
  fitMode: FitMode;
  crop?: CropSpec;
  filters?: FilterSpec[];
}

export interface TextLayerContent {
  text: string; // Can include placeholders like ${name}
  font: FontSpec;
  color: string;
  alignment: TextAlignment;
  shrinkToFit?: boolean;
  maxLines?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ShapeLayerContent {
  shape: 'rectangle' | 'circle' | 'polygon' | 'path';
  fill?: string;
  stroke?: StrokeSpec;
  path?: string; // SVG path for custom shapes
  points?: Point[]; // For polygons
}

export interface MaskLayerContent {
  source: string; // Image or SVG for masking
  inverted?: boolean;
  feather?: number;
}

export interface FontSpec {
  family: string;
  size: number;
  weight?: FontWeight;
  style?: FontStyle;
  variant?: FontVariant;
}

export interface StrokeSpec {
  color: string;
  width: number;
  dashArray?: number[];
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface CropSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FilterSpec {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue-rotate' | 'grayscale' | 'sepia';
  value: number;
}

export interface Point {
  x: number;
  y: number;
}

export type FitMode = 'cover' | 'contain' | 'fill' | 'stretch' | 'crop';
export type AnchorPoint = 'center' | 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontVariant = 'normal' | 'small-caps';

export interface TemplatePlacement {
  [key: string]: any; // Dynamic values for placeholders
}

export interface RenderOptions {
  format: 'png' | 'pdf' | 'webp';
  quality?: number;
  dpi?: number;
  embedFonts?: boolean;
}

// Validation schema for templates
export const TEMPLATE_SCHEMA_VERSION = '1.0.0';

export function validateTemplate(template: any): TemplateSpec {
  if (!template.version || !template.name || !template.canvas || !Array.isArray(template.layers)) {
    throw new Error('Invalid template structure');
  }
  
  if (!template.canvas.width || !template.canvas.height) {
    throw new Error('Canvas must have width and height');
  }
  
  return template as TemplateSpec;
}