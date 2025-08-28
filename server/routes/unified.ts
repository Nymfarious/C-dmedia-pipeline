import { Router } from 'express';
import { 
  UnifiedImageGenSchema,
  UnifiedImageEditSchema,
  UnifiedImg2ImgSchema,
  UnifiedBgRemoveSchema,
  UnifiedUpscaleSchema,
  UnifiedI2VSchema,
  UnifiedTTSSchema,
  UnifiedSVGSchema,
  ApiResponse 
} from '../types.js';
import { replicateService } from '../services/replicate.js';
import { geminiService } from '../services/gemini.js';
import { bananaService } from '../services/banana.js';

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

// Error handler wrapper
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/image/generate
router.post('/generate', validateBody(UnifiedImageGenSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.generateImage(request);
        break;
      case 'gemini':
        asset = await geminiService.generateImage(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Image generated successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      ok: false,
      message: 'Image generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/image/edit
router.post('/edit', validateBody(UnifiedImageEditSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.editImage(request);
        break;
      case 'gemini':
        asset = await geminiService.editImage(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Image edited successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Image editing error:', error);
    res.status(500).json({
      ok: false,
      message: 'Image editing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/image/img2img
router.post('/img2img', validateBody(UnifiedImg2ImgSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.img2img(request);
        break;
      case 'gemini':
        asset = await geminiService.img2img(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Image-to-image conversion successful',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Image-to-image error:', error);
    res.status(500).json({
      ok: false,
      message: 'Image-to-image conversion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/image/bg-remove
router.post('/bg-remove', validateBody(UnifiedBgRemoveSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.removeBackground(request);
        break;
      case 'banana':
        asset = await bananaService.removeBackground(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Background removed successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Background removal error:', error);
    res.status(500).json({
      ok: false,
      message: 'Background removal failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/image/upscale
router.post('/upscale', validateBody(UnifiedUpscaleSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.upscaleImage(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Image upscaled successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Image upscaling error:', error);
    res.status(500).json({
      ok: false,
      message: 'Image upscaling failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/video/i2v
router.post('/i2v', validateBody(UnifiedI2VSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.imageToVideo(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Video generated successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Image-to-video error:', error);
    res.status(500).json({
      ok: false,
      message: 'Video generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/audio/tts
router.post('/tts', validateBody(UnifiedTTSSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.textToSpeech(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'Audio generated successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({
      ok: false,
      message: 'Audio generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /api/image/svg
router.post('/svg', validateBody(UnifiedSVGSchema), asyncHandler(async (req: any, res: any) => {
  const request = req.validatedBody;
  let asset;

  try {
    switch (request.provider) {
      case 'replicate':
        asset = await replicateService.generateSVG(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    const response: ApiResponse = {
      ok: true,
      message: 'SVG generated successfully',
      asset,
      echo: request
    };

    res.json(response);
  } catch (error) {
    console.error('SVG generation error:', error);
    res.status(500).json({
      ok: false,
      message: 'SVG generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;