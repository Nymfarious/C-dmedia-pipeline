import { Router } from 'express';

export const imageRouter = Router();

imageRouter.post('/edit', async (req, res) => {
  const { imageUrl, instruction, maskDataUrl, provider, model } = req.body || {};
  if (!imageUrl || !maskDataUrl) {
    return res.status(400).json({ ok: false, message: 'imageUrl and maskDataUrl required' });
  }

  // TODO: call Replicate SeedEdit 3 or FLUX inpaint here; download the output
  // Temporary: just echo back the original (so UI path is valid)
  return res.json({
    ok: true,
    asset: {
      id: crypto.randomUUID(),
      src: imageUrl,
      name: `Edited (${instruction?.slice(0, 24) || 'edit'})`,
      meta: { provider: provider || 'stub', model: model || 'stub', instruction }
    }
  });
});