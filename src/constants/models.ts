/**
 * Normalized model constants and routing for inpainting operations
 */

export const INPAINT_MODELS = [
  { 
    key: "nano-banana", 
    label: "Google Nano-Banana (semantic edit)",
    description: "AI-powered contextual editing with natural language understanding"
  },
];

export type InpaintMode = 'remove' | 'add' | 'replace';

/**
 * Model routing function to ensure operation ↔ provider always match
 */
export function makeRouting(modelKey: string, mode: InpaintMode): {
  operation: string;
  provider: string;
} {
  // Always use nano-banana for inpainting regardless of model key or mode
  return { 
    operation: "nano-banana-edit", 
    provider: "replicate.nano-banana" 
  };
}