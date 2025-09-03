// Shared types between client and server to avoid coupling issues

export interface AssetResponse {
  id: string;
  type: 'image' | 'audio' | 'animation';
  name: string;
  src: string;
  meta: {
    provider: string;
    model?: string;
    prompt?: string;
    instruction?: string;
    createdAt: number;
    [key: string]: any;
  };
  createdAt: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  echo?: any;
  data?: T;
  asset?: AssetResponse;
  error?: string;
}

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  retryAfter?: number;
}

// Template specification types
export interface TemplateCanvas {
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface TemplateLayer {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  opacity?: number;
  rotation?: number;
  [key: string]: any;
}

export interface TemplateInput {
  id: string;
  name: string;
  type: 'text' | 'image' | 'color';
  required?: boolean;
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface TemplateSpec {
  version: string;
  name: string;
  description?: string;
  canvas: TemplateCanvas;
  layers: TemplateLayer[];
  inputs: TemplateInput[];
  outputs: Array<{
    id: string;
    format: 'png' | 'pdf' | 'jpeg';
    quality?: number;
    dpi?: number;
  }>;
  metadata?: {
    tags?: string[];
    category?: string;
    author?: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

export interface RenderOptions {
  width?: number;
  height?: number;
  dpi?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  embedFonts?: boolean;
  hyperlinks?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    url: string;
  }>;
}

export interface Placements {
  text?: Record<string, string>;
  assets?: Record<string, string>;
  colors?: Record<string, string>;
}