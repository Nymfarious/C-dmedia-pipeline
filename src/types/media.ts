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
  instruction: string; 
  maskAssetId?: string; 
}

export interface TextOverlayParams { 
  text: string; 
  font?: string; 
  size?: number; 
  position?: { x: number; y: number }; 
  align?: "left" | "center" | "right"; 
}

export interface AnimateParams { 
  frames?: number; 
  fps?: number; 
  method?: "sprite" | "lottie"; 
}

export interface SoundParams { 
  ttsText?: string; 
  sfxKind?: string; 
  durationMs?: number; 
}

// Adapter interfaces
export interface ImageGenAdapter { 
  key: string; 
  generate(p: ImageGenParams): Promise<Asset>; 
}

export interface ImageEditAdapter { 
  key: string; 
  edit(asset: Asset, p: ImageEditParams): Promise<Asset>; 
}

export interface TextOverlayAdapter { 
  key: string; 
  addText(asset: Asset, p: TextOverlayParams): Promise<Asset>; 
}

export interface AnimateAdapter { 
  key: string; 
  animate(asset: Asset, p: AnimateParams): Promise<Asset>; 
}

export interface SoundAdapter { 
  key: string; 
  addSound(target: Asset, p: SoundParams): Promise<Asset>; 
}