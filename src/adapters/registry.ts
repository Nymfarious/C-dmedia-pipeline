import { replicateStable } from './image-gen/replicateStable';
import { replicateAdapter } from './image-gen/replicateAdapter';
import { geminiGen } from './image-gen/gemini';
import { fluxProAdapter } from './image-gen/fluxPro';
import { fluxUltraAdapter } from './image-gen/fluxUltra';
import { geminiNanoAdapter as geminiNanoGenAdapter } from './image-gen/geminiNano';
import { openaiAdapter } from './image-gen/openaiAdapter';

// Import all new Replicate models
import {
  fluxSchnellAdapter, fluxDevAdapter, fluxProAdapter as replicateFluxPro, fluxUltraAdapter as replicateFluxUltra,
  sdxlAdapter, sdTurboAdapter, sd15Adapter, sdxlLightningAdapter,
  realVisAdapter, dreamshaperAdapter, deliberateAdapter, realisticVisionAdapter,
  animeDiffusionAdapter, anythingV5Adapter, nijiDiffusionAdapter, openjourneyAdapter,
  midjourneyV4Adapter, protogenAdapter, synthwaveAdapter, vanGoghAdapter,
  dallECloneAdapter, playgroundV2Adapter,
  logoDiffusionAdapter, interiorDesignAdapter, fashionDiffusionAdapter
} from './image-gen/replicateModels';

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

// Enhanced Replicate Edit Adapters
import { 
  nanoBananaAdapter,
  fluxInpaintAdapter as replicateFluxInpaintAdapter,
  professionalUpscalerAdapter,
  advancedObjectRemoverAdapter,
  colorEnhancementAdapter,
  poseAdjustmentAdapter as replicatePoseAdjustmentAdapter,
  faceEnhancementAdapter,
  styleTransferAdapter
} from './image-edit/replicateEditModels';
import { canvasOverlay } from './text-overlay/canvas';
import { openaiTextAdapter } from './text-gen/openaiTextAdapter';
import { fontRecommendationAdapter } from './text-gen/fontRecommendationAdapter';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';

export const providers = {
  imageGen: { 
    // Working models first
    "replicate.flux": replicateAdapter,
    "replicate.sd": replicateStable,
    "openai.dall-e": openaiAdapter,
    "huggingface.flux": {} as any, // Placeholder
    
    // Flux Models - Premium Speed & Quality
    "replicate.flux-schnell": replicateAdapter, // Use working adapter as fallback
    "replicate.flux-dev": replicateAdapter,
    "replicate.flux-pro": replicateAdapter,
    "replicate.flux-ultra": replicateAdapter,
    
    // Stable Diffusion Family
    "replicate.sdxl": sdxlAdapter,
    "replicate.sd-turbo": sdTurboAdapter,
    "replicate.sd-1-5": sd15Adapter,
    "replicate.sdxl-lightning": sdxlLightningAdapter,
    
    // Photorealistic Models
    "replicate.real-vis": realVisAdapter,
    "replicate.dreamshaper": dreamshaperAdapter,
    "replicate.deliberate": deliberateAdapter,
    "replicate.realistic-vision": realisticVisionAdapter,
    
    // Anime & Art Models
    "replicate.anime-diffusion": animeDiffusionAdapter,
    "replicate.anything-v5": anythingV5Adapter,
    "replicate.niji-diffusion": nijiDiffusionAdapter,
    "replicate.openjourney": openjourneyAdapter,
    
    // Artistic & Style Models
    "replicate.midjourney-v4": midjourneyV4Adapter,
    "replicate.protogen": protogenAdapter,
    "replicate.synthwave": synthwaveAdapter,
    "replicate.van-gogh": vanGoghAdapter,
    
    // Creative Models
    "replicate.dall-e-clone": dallECloneAdapter,
    "replicate.playground-v2": playgroundV2Adapter,
    
    // Specialized Models
    "replicate.logo-diffusion": logoDiffusionAdapter,
    "replicate.interior-design": interiorDesignAdapter,
    "replicate.fashion-diffusion": fashionDiffusionAdapter,
    
    // Legacy Support (keep for existing functionality)
    "gemini.img": geminiGen,
    "flux.pro": fluxProAdapter,
    "flux.ultra": fluxUltraAdapter,
    "gemini.nano": geminiNanoGenAdapter
  },
  imageEdit: { 
    // Enhanced Replicate Models
    "replicate.nano-banana": nanoBananaAdapter,
    "replicate.flux-inpaint": replicateFluxInpaintAdapter,
    "replicate.professional-upscaler": professionalUpscalerAdapter,
    "replicate.advanced-object-remover": advancedObjectRemoverAdapter,
    "replicate.color-enhancement": colorEnhancementAdapter,
    "replicate.pose-adjustment": replicatePoseAdjustmentAdapter,
    "replicate.face-enhancement": faceEnhancementAdapter,
    "replicate.style-transfer": styleTransferAdapter,
    
    // Legacy adapters (still available)
    "replicate.flux": replicateEdit,
    "replicate.seed-edit": seedEditAdapter,
    "gemini.conversational-edit": geminiConversationalAdapter,
  "replicate.rembg": backgroundRemoverAdapter,
  "birefnet": backgroundRemoverAdapter,
    "replicate.birefnet": backgroundRemoverAdapter, // Better background removal
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