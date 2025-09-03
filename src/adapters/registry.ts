import { replicateStable } from './image-gen/replicateStable';
import { replicateAdapter } from './image-gen/replicateAdapter';
import { replicateUnifiedAdapter } from './image-gen/replicateUnified';
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
import { replicateUnifiedEditAdapter } from './image-edit/replicateUnified';
import { poseAdjustmentAdapter } from './image-edit/poseAdjustment';
import { smartCropAdapter } from './image-edit/smartCrop';
import { faceConsistencyAdapter } from './image-edit/faceConsistency';
import { seedEditAdapter } from './image-edit/seedEdit';
import { replicateEdit } from './image-edit/replicateEdit';

// Enhanced Replicate Edit Adapters
import { 
  nanoBananaAdapter,
  professionalUpscalerAdapter,
  advancedObjectRemoverAdapter,
  colorEnhancementAdapter,
  poseAdjustmentAdapter as replicatePoseAdjustmentAdapter,
  faceEnhancementAdapter,
  styleTransferAdapter
} from './image-edit/replicateEditModels';
import { canvasOverlay } from './text-overlay/canvas';
import { openaiTextAdapter } from './text-gen/openaiTextAdapter';
import { fluxTextAdapter } from './text-gen/fluxTextAdapter';
import { fontRecommendationAdapter } from './text-gen/fontRecommendationAdapter';
import { spriteAnimator } from './animate/sprite';
import { localTTS } from './sound/ttsLocal';
import { veo3Adapter } from './video-gen/veo3Adapter';
import { runwayAdapter } from './video-gen/runwayAdapter';
import { stableVideoAdapter } from './video-gen/stableVideoAdapter';
import { animateDiffAdapter } from './video-gen/animateDiffAdapter';
import { lumaAdapter } from './video-gen/lumaAdapter';
import { klingAdapter } from './video-gen/klingAdapter';
import { sedanceAdapter } from './video-edit/sedanceAdapter';

export const providers = {
  imageGen: {
    // Primary unified adapter - routes everything through Replicate
    "replicate.unified": replicateUnifiedAdapter,
    "replicate.flux": replicateAdapter,
    "replicate.sd": replicateStable,
    "openai.dall-e": openaiAdapter,
    
    // Google models (now via Replicate)
    "google.nano-banana": replicateUnifiedAdapter,
    "google.flash-1": replicateUnifiedAdapter,
    
    // Flux Models - Premium Speed & Quality
    "replicate.flux-schnell": replicateAdapter,
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
    "replicate.fashion-diffusion": fashionDiffusionAdapter
  },
  imageEdit: {
    // Primary unified adapter - routes everything through Replicate
    "replicate.unified": replicateUnifiedEditAdapter,
    
    // Google models (now via Replicate)
    "google.nano-banana": replicateUnifiedEditAdapter,
    "google.conversational-edit": replicateUnifiedEditAdapter,
    
    // Enhanced Replicate Models
    "replicate.nano-banana": nanoBananaAdapter,
    "replicate.professional-upscaler": professionalUpscalerAdapter,
    "replicate.advanced-object-remover": advancedObjectRemoverAdapter,
    "replicate.color-enhancement": colorEnhancementAdapter,
    "replicate.pose-adjustment": replicatePoseAdjustmentAdapter,
    "replicate.face-enhancement": faceEnhancementAdapter,
    "replicate.style-transfer": styleTransferAdapter,
    
    // Core editing operations
    "replicate.flux": replicateEdit,
    "replicate.seed-edit": seedEditAdapter,
    "replicate.rembg": backgroundRemoverAdapter,
    "birefnet": backgroundRemoverAdapter,
    "replicate.birefnet": backgroundRemoverAdapter,
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
    "flux.text": fluxTextAdapter,
    "ai.font-recommendation": fontRecommendationAdapter
  },
  animate: { 
    "sprite.mock": spriteAnimator 
  },
  sound: { 
    "tts.local": localTTS 
  },
  videoGen: {
    "replicate.veo-3": veo3Adapter,
    "replicate.runway-ml": runwayAdapter,
    "replicate.stable-video": stableVideoAdapter,
    "replicate.animatediff": animateDiffAdapter,
    "replicate.luma-dream": lumaAdapter,
    "replicate.kling-ai": klingAdapter
  },
  videoEdit: {
    "replicate.sedance-1-pro": sedanceAdapter
  },
} as const;

export type ProviderKeys = {
  imageGen: keyof typeof providers.imageGen;
  imageEdit: keyof typeof providers.imageEdit;
  textOverlay: keyof typeof providers.textOverlay;
  animate: keyof typeof providers.animate;
  sound: keyof typeof providers.sound;
  videoGen: keyof typeof providers.videoGen;
  videoEdit: keyof typeof providers.videoEdit;
};