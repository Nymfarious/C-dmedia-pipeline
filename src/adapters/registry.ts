import { replicateStable } from './image-gen/replicateStable';
import { replicateAdapter } from './image-gen/replicateAdapter';
import { geminiGen } from './image-gen/gemini';
import { fluxProAdapter } from './image-gen/fluxPro';
import { fluxUltraAdapter } from './image-gen/fluxUltra';
import { geminiNanoAdapter } from './image-gen/geminiNano';
import { mockEditor } from './image-edit/editorX';
import { seedEditAdapter } from './image-edit/seedEdit';
import { geminiEditAdapter } from './image-edit/geminiEdit';
import { canvasOverlay } from './text-overlay/canvas';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';

export const providers = {
  imageGen: { 
    "replicate.flux": replicateAdapter,
    "replicate.sd": replicateStable, 
    "gemini.img": geminiGen,
    "flux.pro": fluxProAdapter,
    "flux.ultra": fluxUltraAdapter,
    "gemini.nano": geminiNanoAdapter
  },
  imageEdit: { 
    "editor.mock": mockEditor,
    "seededit.3": seedEditAdapter,
    "gemini.edit": geminiEditAdapter
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