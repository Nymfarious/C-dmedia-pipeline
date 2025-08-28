import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';

export const upscalerAdapter: ImageEditAdapter = {
  key: "replicate.upscale",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const apiKey = localStorage.getItem('replicate_api_key');
    
    if (!apiKey) {
      throw new Error('Replicate API key not found. Please set it in settings.');
    }

    // Create prediction for upscaling
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
        input: {
          image: asset.src,
          scale: 2,
          face_enhance: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await pollPrediction(prediction.id, apiKey);
    
    if (!result.output) {
      throw new Error('Failed to upscale image');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Upscaled)`,
      src: result.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.upscale',
        originalAsset: asset.id,
        width: (asset.meta?.width || 512) * 2,
        height: (asset.meta?.height || 512) * 2
      },
      createdAt: Date.now(),
      derivedFrom: asset.id,
    };

    return newAsset;
  }
};

async function pollPrediction(id: string, apiKey: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prediction: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    if (prediction.status === 'succeeded') {
      return prediction;
    } else if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Prediction timed out');
}