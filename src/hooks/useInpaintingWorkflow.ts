import { useState, useCallback } from 'react';
import { Asset, ImageEditParams } from '@/types/media';
import { useToast } from '@/hooks/use-toast';

export interface InpaintingState {
  mode: 'remove' | 'add' | 'replace';
  selectedModel: string;
  instruction: string;
  mask: { dataUrl: string; blob: Blob } | null;
  isProcessing: boolean;
  showAdvanced: boolean;
  parameters: {
    strength: number;
    guidanceScale: number;
    steps: number;
  };
}

export function useInpaintingWorkflow() {
  const { toast } = useToast();
  
  const [state, setState] = useState<InpaintingState>({
    mode: 'replace',
    selectedModel: 'nano-banana',
    instruction: '',
    mask: null,
    isProcessing: false,
    showAdvanced: false,
    parameters: {
      strength: 0.85,
      guidanceScale: 10.5,
      steps: 35
    }
  });

  const updateState = useCallback((updates: Partial<InpaintingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateParameters = useCallback((params: Partial<InpaintingState['parameters']>) => {
    setState(prev => ({ 
      ...prev, 
      parameters: { ...prev.parameters, ...params } 
    }));
  }, []);

  const validateInpaintingParams = useCallback((asset: Asset): string | null => {
    if (!state.mask) return "Create a mask first";
    if (!state.instruction.trim()) return "Add an instruction";
    if (!asset?.src) return "No image selected";
    return null;
  }, [state.mask, state.instruction]);

  const buildInpaintingParams = useCallback((asset: Asset): ImageEditParams => {
    // Always use nano-banana for inpainting operations
    const operation = 'nano-banana-edit';
    const provider = 'replicate.nano-banana';

    return {
      operation,
      instruction: state.instruction,
      provider,
      mode: state.mode as any,
      maskPngDataUrl: state.mask!.dataUrl,
      maskBlob: state.mask!.blob,
      strength: state.parameters.strength,
      guidance_scale: state.parameters.guidanceScale,
      num_inference_steps: state.parameters.steps,
      // Legacy compatibility
      ...(state.mode === 'remove' && { removeObjectInstruction: state.instruction }),
      ...(state.mode === 'add' && { addObjectInstruction: state.instruction }),
    };
  }, [state]);

  const executeInpainting = useCallback(async (
    asset: Asset, 
    onComplete: (params: ImageEditParams) => Promise<void>
  ) => {
    const validationError = validateInpaintingParams(asset);
    if (validationError) {
      toast({
        title: "Invalid Parameters",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    updateState({ isProcessing: true });
    
    try {
      const params = buildInpaintingParams(asset);
      await onComplete(params);
      
      toast({
        title: "Processing Complete",
        description: `Successfully applied ${state.mode} operation`,
      });
    } catch (error) {
      console.error('Inpainting failed:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      updateState({ isProcessing: false });
    }
  }, [state, validateInpaintingParams, buildInpaintingParams, updateState, toast]);

  return {
    state,
    updateState,
    updateParameters,
    validateInpaintingParams,
    buildInpaintingParams,
    executeInpainting
  };
}