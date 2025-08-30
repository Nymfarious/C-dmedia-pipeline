import { replicateStable } from './image-gen/replicateStable';
import { replicateAdapter } from './image-gen/replicateAdapter';
import { geminiGen } from './image-gen/gemini';
import { fluxProAdapter } from './image-gen/fluxPro';
import { fluxUltraAdapter } from './image-gen/fluxUltra';
import { geminiNanoAdapter as geminiNanoGenAdapter } from './image-gen/geminiNano';
import { openaiAdapter } from './image-gen/openaiAdapter';

import { backgroundRemoverAdapter } from './image-edit/backgroundRemover';
import { upscalerAdapter } from './image-edit/upscaler';
import { objectRemoverAdapter } from './image-edit/objectRemover';
import { objectAdderAdapter } from './image-edit/objectAdder';
import { colorEnhancerAdapter } from './image-edit/colorEnhancer';
import { enhancedUpscalerAdapter } from './image-edit/enhancedUpscaler';
import { geminiNanoAdapter } from './image-edit/geminiNano';
import { poseAdjustmentAdapter } from './image-edit/poseAdjustment';
import { smartCropAdapter } from './image-edit/smartCrop';
import { faceConsistencyAdapter } from './image-edit/faceConsistency';
import { seedEditAdapter } from './image-edit/seedEdit';
import { fluxInpaintAdapter } from './image-edit/fluxInpaint';
import { geminiConversationalAdapter } from './image-edit/geminiConversational';
import { replicateEdit } from './image-edit/replicateEdit';
import { canvasOverlay } from './text-overlay/canvas';
import { openaiTextAdapter } from './text-gen/openaiTextAdapter';
import { fontRecommendationAdapter } from './text-gen/fontRecommendationAdapter';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';

export const providers = {
  imageGen: { 
    "replicate.flux": replicateAdapter,
    "replicate.sd": replicateStable,
    "gemini.img": geminiGen,
    "flux.pro": fluxProAdapter,
    "flux.ultra": fluxUltraAdapter,
    "gemini.nano": geminiNanoGenAdapter,
    "openai.dall-e": openaiAdapter
  },
  imageEdit: { 
    "replicate.flux": replicateEdit,
    "replicate.nano-banana": geminiNanoAdapter,
    "replicate.seed-edit": seedEditAdapter,
    "replicate.flux-inpaint": fluxInpaintAdapter,
    "gemini.conversational-edit": geminiConversationalAdapter,
    "replicate.rembg": backgroundRemoverAdapter,
    "replicate.upscale": upscalerAdapter,
    "replicate.object-remove": objectRemoverAdapter,
    "replicate.object-add": objectAdderAdapter,
    "replicate.color-enhance": colorEnhancerAdapter,
    "replicate.enhanced-upscale": enhancedUpscalerAdapter,
    "replicate.pose": poseAdjustmentAdapter,
    "replicate.smart-crop": smartCropAdapter,
    "replicate.face-id": faceConsistencyAdapter
  },
  textOverlay: { 
    "canvas.text": canvasOverlay,
    "openai.text": openaiTextAdapter,
    "ai.font-recommendation": fontRecommendationAdapter
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