import { 
  UnifiedImageGenRequest, 
  UnifiedImageEditRequest,
  UnifiedImg2ImgRequest,
  UnifiedBgRemoveRequest,
  UnifiedUpscaleRequest,
  UnifiedI2VRequest,
  UnifiedTTSRequest,
  UnifiedSVGRequest,
  AssetResponse,
  REPLICATE_MODELS 
} from '../types.js';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

class ReplicateService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.REPLICATE_API_TOKEN || '';
    
    // Fail fast in production if API key is missing
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('REPLICATE_API_TOKEN is required in production');
    }
    
    if (!this.apiKey) {
      console.warn('REPLICATE_API_TOKEN not set - using stub responses in development');
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<ReplicateResponse> {
    if (!this.apiKey) {
      // Return stub response for development
      return {
        id: `stub-${Date.now()}`,
        status: 'succeeded',
        output: 'https://replicate.delivery/stub-image.jpg'
      };
    }

    const response = await fetch(`${REPLICATE_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async pollPrediction(predictionId: string): Promise<ReplicateResponse> {
    if (!this.apiKey) {
      // Return stub response
      return {
        id: predictionId,
        status: 'succeeded',
        output: 'https://replicate.delivery/stub-image.jpg'
      };
    }

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      const response = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.statusText}`);
      }

      const result: ReplicateResponse = await response.json();

      if (result.status === 'succeeded' || result.status === 'failed') {
        return result;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    }

    throw new Error('Prediction timed out');
  }

  private getModelVersion(model?: string, operation?: string): string {
    if (!model) {
      // Default models by operation
      switch (operation) {
        case 'txt2img': return REPLICATE_MODELS['flux-1.1-pro'];
        case 'img2img': return REPLICATE_MODELS['sdxl-controlnet-openpose'];
        case 'edit': return REPLICATE_MODELS['seededit-3.0'];
        case 'bg-remove': return REPLICATE_MODELS['bg-remover'];
        case 'upscale': return REPLICATE_MODELS['real-esrgan'];
        case 'i2v': return REPLICATE_MODELS['i2vgen-xl'];
        case 'tts': return REPLICATE_MODELS['xtts-v2'];
        case 'svg': return REPLICATE_MODELS['recraft-v3-svg'];
        default: return REPLICATE_MODELS['flux-1.1-pro'];
      }
    }

    return REPLICATE_MODELS[model as keyof typeof REPLICATE_MODELS] || model;
  }

  private createAssetFromOutput(output: string | string[], request: any, type: 'image' | 'audio' | 'animation'): AssetResponse {
    const url = Array.isArray(output) ? output[0] : output;
    
    return {
      id: crypto.randomUUID(),
      type,
      name: this.generateAssetName(request, type),
      src: url,
      meta: {
        provider: 'replicate',
        model: request.model,
        prompt: request.prompt,
        createdAt: Date.now(),
      },
      createdAt: Date.now(),
    };
  }

  private generateAssetName(request: any, type: string): string {
    const prompt = request.prompt || request.instruction || request.text || 'Generated';
    const truncated = prompt.slice(0, 30);
    const timestamp = new Date().toLocaleTimeString();
    return `${type}_${truncated}_${timestamp}`;
  }

  async generateImage(request: UnifiedImageGenRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'txt2img');
    
    const input: any = {
      prompt: request.prompt,
      width: request.width || 1024,
      height: request.height || 1024,
      num_outputs: request.numOutputs || 1,
    };

    if (request.negativePrompt) input.negative_prompt = request.negativePrompt;
    if (request.seed) input.seed = request.seed;
    if (request.scheduler) input.scheduler = request.scheduler;
    if (request.mode) input.mode = request.mode;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image generation failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }

  async editImage(request: UnifiedImageEditRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'edit');
    
    const input: any = {
      image: request.imageUrl,
      instruction: request.instruction,
    };

    if (request.maskUrl) input.mask = request.maskUrl;
    if (request.strength) input.strength = request.strength;
    if (request.seed) input.seed = request.seed;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image editing failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }

  async img2img(request: UnifiedImg2ImgRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'img2img');
    
    const input: any = {
      image: request.imageUrl,
    };

    if (request.prompt) input.prompt = request.prompt;
    if (request.poseUrl) input.pose_image = request.poseUrl;
    if (request.strength) input.strength = request.strength;
    if (request.seed) input.seed = request.seed;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image-to-image failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }

  async removeBackground(request: UnifiedBgRemoveRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'bg-remove');
    
    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input: {
        image: request.imageUrl,
      },
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Background removal failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }

  async upscaleImage(request: UnifiedUpscaleRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'upscale');
    
    const input: any = {
      image: request.imageUrl,
      scale: request.scale || 2,
    };

    if (request.faceEnhance) {
      input.face_enhance = true;
    }

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image upscaling failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }

  async imageToVideo(request: UnifiedI2VRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'i2v');
    
    const input: any = {
      image: request.imageUrl,
      num_frames: request.numFrames || 25,
    };

    if (request.prompt) input.prompt = request.prompt;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Image-to-video failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'animation');
  }

  async textToSpeech(request: UnifiedTTSRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'tts');
    
    const input: any = {
      text: request.text,
    };

    if (request.voice) input.voice = request.voice;
    if (request.voiceUrl) input.voice_url = request.voiceUrl;
    if (request.language) input.language = request.language;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'Text-to-speech failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'audio');
  }

  async generateSVG(request: UnifiedSVGRequest): Promise<AssetResponse> {
    const modelVersion = this.getModelVersion(request.model, 'svg');
    
    const input: any = {
      prompt: request.prompt,
    };

    if (request.style) input.style = request.style;

    const prediction = await this.makeRequest('/predictions', {
      version: modelVersion,
      input,
    });

    const result = await this.pollPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(result.error || 'SVG generation failed');
    }

    return this.createAssetFromOutput(result.output!, request, 'image');
  }
}

export const replicateService = new ReplicateService();