import { 
  UnifiedImageGenRequest, 
  UnifiedImageEditRequest,
  AssetResponse,
  GEMINI_MODELS 
} from '../types.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    // Fail fast in production if API key is missing
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('GEMINI_API_KEY is required in production');
    }
    
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not set - using stub responses in development');
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<GeminiResponse> {
    if (!this.apiKey) {
      // Return stub response for development
      return {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'stub-base64-data'
              }
            }]
          }
        }]
      };
    }

    const response = await fetch(`${GEMINI_API_BASE}${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    return response.json();
  }

  private getModelName(model?: string): string {
    if (!model) {
      return GEMINI_MODELS['gemini-2.5-flash-image'];
    }
    return GEMINI_MODELS[model as keyof typeof GEMINI_MODELS] || model;
  }

  private createAssetFromResponse(response: GeminiResponse, request: any, type: 'image'): AssetResponse {
    const candidate = response.candidates[0];
    const imagePart = candidate.content.parts.find(part => part.inlineData);
    
    if (!imagePart?.inlineData) {
      throw new Error('No image data in Gemini response');
    }

    // Convert base64 to data URL for Node.js compatibility - no browser APIs
    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const url = `data:${mimeType};base64,${base64Data}`;
    
    return {
      id: crypto.randomUUID(),
      type,
      name: this.generateAssetName(request, type),
      src: url,
      meta: {
        provider: 'gemini',
        model: request.model || 'gemini-2.5-flash-image',
        prompt: request.prompt || request.instruction,
        createdAt: Date.now(),
      },
      createdAt: Date.now(),
    };
  }

  private generateAssetName(request: any, type: string): string {
    const prompt = request.prompt || request.instruction || 'Generated';
    const truncated = prompt.slice(0, 30);
    const timestamp = new Date().toLocaleTimeString();
    return `${type}_gemini_${truncated}_${timestamp}`;
  }

  async generateImage(request: UnifiedImageGenRequest): Promise<AssetResponse> {
    const modelName = this.getModelName(request.model);
    
    const parts = [
      {
        text: `Generate an image: ${request.prompt}${request.negativePrompt ? ` Avoid: ${request.negativePrompt}` : ''}`
      }
    ];

    const response = await this.makeRequest(`/models/${modelName}:generateContent`, {
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    return this.createAssetFromResponse(response, request, 'image');
  }

  async editImage(request: UnifiedImageEditRequest): Promise<AssetResponse> {
    const modelName = this.getModelName(request.model);
    
    // Fetch the source image to include in the request - Node.js compatible
    const imageResponse = await fetch(request.imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const parts = [
      {
        text: `Edit this image: ${request.instruction}`
      },
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ];

    const response = await this.makeRequest(`/models/${modelName}:generateContent`, {
      contents: [{
        parts
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    return this.createAssetFromResponse(response, request, 'image');
  }

  async img2img(request: UnifiedImageEditRequest): Promise<AssetResponse> {
    // Gemini handles img2img similar to image editing
    return this.editImage(request);
  }
}

export const geminiService = new GeminiService();