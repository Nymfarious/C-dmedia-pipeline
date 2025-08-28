import { replicateStable } from './image-gen/replicateStable';
import { geminiGen } from './image-gen/gemini';
import { mockEditor } from './image-edit/editorX';
import { canvasOverlay } from './text-overlay/canvas';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';

export const providers = {
  imageGen: { 
    "replicate.sd": replicateStable, 
    "gemini.img": geminiGen 
  },
  imageEdit: { 
    "editor.mock": mockEditor 
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