/**
 * Normalized model constants and routing for inpainting operations
 */

export const INPAINT_MODELS = [
  { 
    key: "nano-banana", 
    label: "Google Nano-Banana (semantic edit)",
    description: "AI-powered contextual editing with natural language understanding"
  },
  { 
    key: "flux-inpaint", 
    label: "FLUX Inpaint (precision mask)",
    description: "High-quality precision masked editing"
  },
  { 
    key: "advanced-remover", 
    label: "Advanced Object Remover",
    description: "Specialized for clean object removal"
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
  switch (modelKey) {
    case "nano-banana":
      return { 
        operation: "nano-banana-edit", 
        provider: "replicate.nano-banana" 
      };
    case "flux-inpaint":
      return { 
        operation: "flux-inpaint", 
        provider: "replicate.flux-inpaint" 
      };
    case "advanced-remover":
      return { 
        operation: "advanced-object-removal", 
        provider: "replicate.advanced-remover" 
      };
    default:
      // Smart fallback based on mode
      if (mode === 'remove') {
        return { 
          operation: "advanced-object-removal", 
          provider: "replicate.advanced-remover" 
        };
      } else if (mode === 'add') {
        return { 
          operation: "nano-banana-edit", 
          provider: "replicate.nano-banana" 
        };
      } else {
        return { 
          operation: "flux-inpaint", 
          provider: "replicate.flux-inpaint" 
        };
      }
  }
}