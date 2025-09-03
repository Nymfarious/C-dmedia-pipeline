import { Router } from 'express';

export const imageRouter = Router();

imageRouter.post('/edit', async (req, res) => {
  const { imageUrl, instruction, maskDataUrl, provider, model } = req.body || {};
  if (!imageUrl || !maskDataUrl) {
    return res.status(400).json({ ok: false, message: 'imageUrl and maskDataUrl required' });
  }

  try {
    const { replicateService } = await import('../services/replicate.js');
    const asset = await replicateService.editImage({
      imageUrl,
      instruction,
      maskUrl: maskDataUrl,
      model: model || 'seededit-3.0',
      provider: provider || 'replicate'
    });
    
    return res.json({
      ok: true,
      message: 'Image edited successfully',
      asset
    });
  } catch (error) {
    console.error('Image editing error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Image editing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});