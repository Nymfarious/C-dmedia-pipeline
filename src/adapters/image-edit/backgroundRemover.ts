import { Asset, ImageEditAdapter, ImageEditParams } from '@/types/media';

export const backgroundRemoverAdapter: ImageEditAdapter = {
  key: "replicate.rembg",
  
  async edit(asset: Asset, params: ImageEditParams): Promise<Asset> {
    const apiKey = localStorage.getItem('replicate_api_key');
    
    if (!apiKey) {
      throw new Error('Replicate API key not found. Please set it in settings.');
    }

    // Create prediction for background removal
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: {
          image: asset.src
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await pollPrediction(prediction.id, apiKey);
    
    if (!result.output) {
      throw new Error('Failed to remove background');
    }

    // Create new asset
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: asset.type,
      name: `${asset.name} (Background Removed)`,
      src: result.output,
      meta: {
        ...asset.meta,
        provider: 'replicate.rembg',
        originalAsset: asset.id
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