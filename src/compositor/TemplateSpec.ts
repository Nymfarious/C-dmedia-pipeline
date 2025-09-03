export interface TemplateSpec {
  version: string;
  name: string;
  description?: string;
  category?: string;
  canvas: CanvasSpec;
  layers: LayerSpec[];
  inputs?: Record<string, TemplateInput>;
  outputs?: Record<string, TemplateOutput>;
  metadata?: Record<string, any>;
}

export interface TemplateInput {
  type: 'text' | 'asset' | 'color' | 'number' | 'ai-prompt' | 'ai-style' | 'ai-negative' | 'ai-params';
  required?: boolean;
  default?: any;
  description?: string;
  options?: string[]; // For style dropdown options
  placeholder?: string; // For prompt textarea placeholder
}

export interface TemplateOutput {
  type: 'image' | 'pdf';
  format?: string;
  quality?: number;
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
  type: 'image' | 'text' | 'shape' | 'mask' | 'ai-image' | 'ai-text';
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  transform?: TransformSpec;
  content: ImageLayerContent | TextLayerContent | ShapeLayerContent | MaskLayerContent | AIImageLayerContent | AITextLayerContent;
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

export interface AIImageLayerContent {
  prompt: string; // Can include placeholders like ${prompt}
  negativePrompt?: string;
  aiOperation: AIOperation;
  fallbackSource?: string; // Fallback image if AI generation fails
  placeholder?: string; // Placeholder text during generation
}

export interface AITextLayerContent {
  prompt: string; // AI prompt for text generation
  aiOperation: AIOperation;
  font: FontSpec;
  color: string;
  alignment: TextAlignment;
  fallbackText?: string; // Fallback text if AI generation fails
  maxLength?: number;
}

export interface AIOperation {
  provider: string; // e.g., "replicate.nano-banana", "openai.dall-e"
  operation: string; // e.g., "generate", "edit", "text-generation"
  model?: string; // Specific model variant
  parameters?: Record<string, any>; // AI-specific parameters
  cache?: boolean; // Whether to cache AI results
  retries?: number; // Number of retries for AI operations
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
  variables?: Record<string, any>;
  assets?: Record<string, any>;
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