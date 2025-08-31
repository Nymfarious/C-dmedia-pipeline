// Asset types and lifecycle
export type MediaType = "image" | "animation" | "audio";

export interface Asset {
  id: string;
  type: MediaType;
  name: string;
  src: string;          // blob/object URL or remote URL
  meta?: Record<string, any>; // e.g., width/height, duration, provider info
  createdAt: number;
  derivedFrom?: string; // parent asset id
  category?: string;    // main category like "Generated", "Uploaded", "Edited"
  subcategory?: string; // subcategory like "Portraits", "Landscapes", "Characters"
  tags?: string[];      // searchable tags
}

export interface PipelineStep {
  id: string;
  kind: "GENERATE" | "EDIT" | "ADD_TEXT" | "ANIMATE" | "ADD_SOUND" | "UPSCALE" | "REMOVE_BG";
  inputAssetIds: string[];   // can be empty for GENERATE
  outputAssetId?: string;
  params: Record<string, any>;
  provider: string;          // adapter key, e.g., "replicate.sd", "gemini.img"
  status: "queued" | "running" | "done" | "failed";
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  subcategories: string[];
  icon?: string;
  color?: string;
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'generated', name: 'Generated', subcategories: ['Portraits', 'Landscapes', 'Characters', 'Objects', 'Abstract'], icon: 'Sparkles', color: 'hsl(var(--primary))' },
  { id: 'uploaded', name: 'Uploaded', subcategories: ['Photos', 'Graphics', 'Assets', 'References'], icon: 'Upload', color: 'hsl(var(--secondary))' },
  { id: 'edited', name: 'Edited', subcategories: ['Enhanced', 'Upscaled', 'Background Removed', 'Retouched'], icon: 'Edit', color: 'hsl(var(--accent))' },
  { id: 'animated', name: 'Animated', subcategories: ['Sprites', 'Gifs', 'Videos'], icon: 'Film', color: 'hsl(var(--destructive))' }
];

// Provider-agnostic adapter contracts
export interface ImageGenParams { 
  prompt: string; 
  negativePrompt?: string; 
  seed?: number; 
  aspect?: string; 
  refs?: string[]; // asset ids
}

export interface ImageEditParams { 
  operation?: string;
  instruction?: string; 
  provider?: string;
  maskAssetId?: string;
  brushMask?: { x: number; y: number; radius: number }[];
  clickPosition?: { x: number; y: number };
  addObjectInstruction?: string;
  removeObjectInstruction?: string;
  // Mask generation support
  maskPngDataUrl?: string;
  maskBlob?: Blob;
  sourceImageSize?: { width: number; height: number };
  colorAdjustments?: {
    brightness?: number;
    contrast?: number; 
    saturation?: number;
    warmth?: number;
  };
  poseKeypoints?: any[];
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  mode?: 'remove' | 'add' | 'replace' | 'precision-replace' | 'style-transfer' | 'smart-inpaint' | 'detail-enhance';
  // Extended properties for various adapters
  stylePreset?: "film" | "pop-art" | "vintage" | "black-white" | "vivid";
  enhanceFaces?: boolean;
  upscaleFactor?: number;
  poseAdjustments?: Array<{ x: number; y: number; id: string; label: string }>;
  targetImageUrl?: string;
  referenceImageUrl?: string;
  cropSettings?: {
    aspectRatio: string;
    preset: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  multiImageUrls?: string[];
  compositionStyle?: string;
  complexity?: 'low' | 'medium' | 'high';
  targetQuality?: 'draft' | 'standard' | 'high';
  preserveContext?: boolean;
  scale?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  warmth?: number;
  combineMode?: string;
}

export interface TextOverlayParams { 
  text: string; 
  font?: string; 
  color?: string; 
  position?: string | { x: number; y: number; };
  size?: number;
  align?: 'left' | 'center' | 'right';
}

export interface AnimationParams { 
  frameRate?: number; 
  duration?: number; 
  type?: string;
  frames?: number;
  fps?: number;
}

export interface SoundParams { 
  voice?: string; 
  speed?: number; 
  language?: string;
  ttsText?: string;
  durationMs?: number;
}

// Unified adapter interfaces
export interface ImageGenAdapter {
  key: string;
  generate(params: ImageGenParams): Promise<Asset>;
}

export interface ImageEditAdapter {
  key: string;
  edit(asset: Asset, params: ImageEditParams): Promise<Asset>;
}

export interface TextOverlayAdapter {
  key: string;
  overlay?(asset: Asset, params: TextOverlayParams): Promise<Asset>;
  addText?(asset: Asset, params: TextOverlayParams): Promise<Asset>;
}

export interface AnimationAdapter {
  key: string;
  animate(asset: Asset, params: AnimationParams): Promise<Asset>;
}

export interface SoundAdapter {
  key: string;
  addSound(asset: Asset, params: SoundParams): Promise<Asset>;
}

// Project Management
export interface Project {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  steps: PipelineStep[];
  createdAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// Gallery and Search
export interface SearchFilters {
  categories?: string[];
  subcategories?: string[];
  tags?: string[];
  dateRange?: { start: number; end: number };
  providers?: string[];
  hasMetadata?: string[];
}

export interface SortOptions {
  field: 'createdAt' | 'name' | 'category' | 'subcategory';
  direction: 'asc' | 'desc';
}

// Enhanced Gallery Features
export interface GalleryViewMode {
  type: 'grid' | 'list' | 'masonry';
  size: 'small' | 'medium' | 'large';
  showMetadata: boolean;
  showActions: boolean;
}

export interface BulkAction {
  type: 'delete' | 'categorize' | 'tag' | 'export';
  targetIds: string[];
  params?: Record<string, any>;
}

// Analytics and Insights
export interface UsageStats {
  totalAssets: number;
  byCategory: Record<string, number>;
  byProvider: Record<string, number>;
  recentActivity: Array<{
    type: 'generated' | 'edited' | 'uploaded';
    count: number;
    date: string;
  }>;
}

// Export/Import
export interface ExportOptions {
  format: 'json' | 'zip';
  includeMetadata: boolean;
  includeAssets: boolean;
  compression?: 'none' | 'standard' | 'maximum';
}

export interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
  importedAssets: Asset[];
}

// Settings and Preferences
export interface UserPreferences {
  defaultCategory: string;
  autoTagging: boolean;
  galleryView: GalleryViewMode;
  notifications: {
    onComplete: boolean;
    onError: boolean;
    onImport: boolean;
  };
  shortcuts: Record<string, string>;
}

// Real-time collaboration (future)
export interface CollaborationEvent {
  type: 'asset_added' | 'asset_edited' | 'asset_deleted' | 'project_updated';
  userId: string;
  timestamp: number;
  data: any;
}

// Legacy compatibility exports
export interface GalleryImage extends Asset {
  url?: string;
  prompt?: string;
  favorite?: boolean;
  model?: string;
  parameters?: any;
  created?: string;
}
export interface GalleryMetadata extends Record<string, any> {}

// Legacy adapter type aliases
export interface AnimateAdapter extends AnimationAdapter {}
export interface AnimateParams extends AnimationParams {}