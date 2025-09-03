/**
 * Normalized model constants and routing for inpainting operations
 * All models now route through Replicate for consistency
 */

import { resolveModelString, getDefaultModel } from '@/models/registry';

export const INPAINT_MODELS = [
  { 
    key: "nano-banana", 
    label: "Google Nano-Banana (via Replicate)",
    description: "AI-powered contextual editing with natural language understanding"
  },
  {
    key: "flux-pro",
    label: "FLUX Pro (via Replicate)", 
    description: "High-quality image editing and inpainting"
  }
];

export type InpaintMode = 'remove' | 'add' | 'replace';

/**
 * Model routing function - now uses centralized registry
 */
export function makeRouting(modelKey: string, mode: InpaintMode): {
  operation: string;
  provider: string;
} {
  // Use registry to resolve model, default to nano-banana for editing
  const resolvedModel = modelKey === 'nano-banana' 
    ? getDefaultModel('conversational-edit')
    : getDefaultModel('image-edit');
    
  return { 
    operation: "unified-edit", 
    provider: "replicate.unified" 
  };
}