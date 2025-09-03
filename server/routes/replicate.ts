import { Router } from 'express';
import { 
  FluxTxt2ImgSchema,
  SdxlImg2ImgSchema, 
  SeedEditSchema,
  BgRemoveSchema,
  UpscaleSchema,
  I2VSchema,
  TTSSchema,
  SvgGenerateSchema,
  ApiResponse 
} from '../types.js';

const router = Router();

// Validation middleware
const validateBody = (schema: any) => (req: any, res: any, next: any) => {
  try {
    const validated = schema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    res.status(400).json({ 
      ok: false, 
      message: 'Validation failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// POST /api/replicate/flux/txt2img
router.post('/flux/txt2img', validateBody(FluxTxt2ImgSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.generateImage({
      prompt: req.validatedBody.prompt,
      width: req.validatedBody.width,
      height: req.validatedBody.height,
      model: 'flux-1.1-pro',
      ...req.validatedBody
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Image generated successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Image generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/sdxl/img2img
router.post('/sdxl/img2img', validateBody(SdxlImg2ImgSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.img2img({
      imageUrl: req.validatedBody.image,
      prompt: req.validatedBody.prompt,
      model: 'sdxl-controlnet-openpose',
      ...req.validatedBody
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Image-to-image conversion successful',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Image-to-image conversion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/seededit/edit
router.post('/seededit/edit', validateBody(SeedEditSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.editImage({
      imageUrl: req.validatedBody.image,
      instruction: req.validatedBody.instruction,
      maskUrl: req.validatedBody.mask,
      model: 'seededit-3.0',
      ...req.validatedBody
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Image editing successful',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Image editing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/bg/remove
router.post('/bg/remove', validateBody(BgRemoveSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.removeBackground({
      imageUrl: req.validatedBody.image,
      model: 'bg-remover'
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Background removed successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Background removal failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/upscale
router.post('/upscale', validateBody(UpscaleSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.upscaleImage({
      imageUrl: req.validatedBody.image,
      scale: req.validatedBody.scale || 2,
      model: 'real-esrgan'
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Image upscaled successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Image upscaling failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/i2v
router.post('/i2v', validateBody(I2VSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.imageToVideo({
      imageUrl: req.validatedBody.image,
      prompt: req.validatedBody.prompt,
      numFrames: req.validatedBody.num_frames || 25,
      model: 'i2vgen-xl'
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Video generated successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Video generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/voice/tts
router.post('/voice/tts', validateBody(TTSSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.textToSpeech({
      text: req.validatedBody.text,
      voice: req.validatedBody.voice,
      language: req.validatedBody.language,
      model: 'xtts-v2'
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'Audio generated successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Audio generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/replicate/svg/generate
router.post('/svg/generate', validateBody(SvgGenerateSchema), async (req, res) => {
  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.generateSVG({
      prompt: req.validatedBody.prompt,
      style: req.validatedBody.style,
      model: 'recraft-v3-svg'
    });
    
    const response: ApiResponse = {
      ok: true,
      message: 'SVG generated successfully',
      asset
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'SVG generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;