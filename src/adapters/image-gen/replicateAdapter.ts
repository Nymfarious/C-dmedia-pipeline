import { ImageGenAdapter, ImageGenParams, Asset } from '@/types/media';

export const replicateAdapter: ImageGenAdapter = {
  key: "replicate.flux",
  
  async generate(params: ImageGenParams): Promise<Asset> {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
      throw new Error('Replicate API key not found. Please configure it in settings.');
    }

    try {
      // Create prediction
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "black-forest-labs/flux-schnell",
          input: {
            prompt: params.prompt,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 80,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const prediction = await response.json();
      
      // Poll for completion
      const result = await pollPrediction(prediction.id, apiKey);
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      }

      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      
      return {
        id: crypto.randomUUID(),
        type: 'image',
        name: `Generated: ${params.prompt.slice(0, 30)}...`,
        src: imageUrl,
        meta: { 
          width: 1024, 
          height: 1024, 
          prompt: params.prompt,
          provider: 'replicate.flux'
        },
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error('Replicate generation failed:', error);
      throw error;
    }
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
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    if (prediction.status === 'succeeded' || prediction.status === 'failed') {
      return prediction;
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Prediction timed out');
}