import { replicateStable } from './image-gen/replicateStable';
import { replicateAdapter } from './image-gen/replicateAdapter';
import { backgroundRemoverAdapter } from './image-edit/backgroundRemover';
import { upscalerAdapter } from './image-edit/upscaler';
import { canvasOverlay } from './text-overlay/canvas';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';

export const providers = {
  imageGen: { 
    "replicate.flux": replicateAdapter,
    "replicate.sd": replicateStable
  },
  imageEdit: { 
    "replicate.rembg": backgroundRemoverAdapter,
    "replicate.upscale": upscalerAdapter
  },
  textOverlay: { 
    "canvas.text": canvasOverlay 
  },
  animate: { 
    "sprite.mock": spriteAnimator 
  },
  sound: { 
    "tts.local": localTTS 
  },
} as const;

export type ProviderKeys = {
  imageGen: keyof typeof providers.imageGen;
  imageEdit: keyof typeof providers.imageEdit;
  textOverlay: keyof typeof providers.textOverlay;
  animate: keyof typeof providers.animate;
  sound: keyof typeof providers.sound;
};