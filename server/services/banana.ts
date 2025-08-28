import { 
  UnifiedBgRemoveRequest,
  AssetResponse 
} from '../types.js';

interface BananaResponse {
  id: string;
  message: string;
  created: number;
  apiVersion: string;
  modelOutputs: Array<{
    image_base64?: string;
    image_url?: string;
  }>;
}

class BananaService {
  private apiKey: string;
  private modelKey: string;

  constructor() {
    this.apiKey = process.env.BANANA_API_KEY || '';
    this.modelKey = process.env.BANANA_MODEL_KEY || '';
    if (!this.apiKey) {
      console.warn('BANANA_API_KEY not set - using stub responses');
    }
  }

  private async makeRequest(modelInputs: any): Promise<BananaResponse> {
    if (!this.apiKey) {
      // Return stub response for development
      return {
        id: `banana-stub-${Date.now()}`,
        message: 'success',
        created: Date.now(),
        apiVersion: '1.0.0',
        modelOutputs: [{
          image_url: 'https://banana.dev/stub-bg-removed.png'
        }]
      };
    }

    const response = await fetch('https://api.banana.dev/start/v4/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        modelKey: this.modelKey,
        modelInputs,
      }),
    });

    if (!response.ok) {
      throw new Error(`Banana API error: ${response.statusText}`);
    }

    return response.json();
  }

  private createAssetFromResponse(response: BananaResponse, request: UnifiedBgRemoveRequest): AssetResponse {
    const output = response.modelOutputs[0];
    let url: string;

    if (output.image_url) {
      url = output.image_url;
    } else if (output.image_base64) {
      // Convert base64 to blob URL
      const base64Data = output.image_base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'image/png' });
      url = URL.createObjectURL(blob);
    } else {
      throw new Error('No image data in Banana response');
    }

    return {
      id: crypto.randomUUID(),
      type: 'image',
      name: this.generateAssetName(request),
      src: url,
      meta: {
        provider: 'banana',
        model: request.model || 'bg-remover',
        operation: 'background-removal',
        createdAt: Date.now(),
      },
      createdAt: Date.now(),
    };
  }

  private generateAssetName(request: UnifiedBgRemoveRequest): string {
    const timestamp = new Date().toLocaleTimeString();
    return `bg_removed_banana_${timestamp}`;
  }

  async removeBackground(request: UnifiedBgRemoveRequest): Promise<AssetResponse> {
    const modelInputs = {
      imageURL: request.imageUrl,
    };

    const response = await this.makeRequest(modelInputs);

    if (response.message !== 'success') {
      throw new Error('Background removal failed');
    }

    return this.createAssetFromResponse(response, request);
  }
}

export const bananaService = new BananaService();