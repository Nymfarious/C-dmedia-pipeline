import { vi } from 'vitest';

// Mock image generation adapters
export const mockFluxProAdapter = {
  generateImage: vi.fn().mockResolvedValue({
    url: 'https://example.com/generated-image.png',
    width: 1024,
    height: 1024,
  }),
};

export const mockOpenAIAdapter = {
  generateImage: vi.fn().mockResolvedValue({
    url: 'https://example.com/openai-image.png',
    width: 512,
    height: 512,
  }),
};

// Mock image edit adapters
export const mockBackgroundRemoverAdapter = {
  removeBackground: vi.fn().mockResolvedValue({
    url: 'https://example.com/no-bg-image.png',
  }),
};

export const mockUpscalerAdapter = {
  upscale: vi.fn().mockResolvedValue({
    url: 'https://example.com/upscaled-image.png',
    width: 2048,
    height: 2048,
  }),
};

// Mock text generation adapters
export const mockOpenAITextAdapter = {
  generateText: vi.fn().mockResolvedValue({
    text: 'Generated text content',
  }),
};

// Mock video generation adapters
export const mockLumaAdapter = {
  generateVideo: vi.fn().mockResolvedValue({
    url: 'https://example.com/generated-video.mp4',
    duration: 5,
  }),
};

// Mock animate adapter
export const mockSpriteAdapter = {
  animate: vi.fn().mockResolvedValue({
    frames: [
      'https://example.com/frame1.png',
      'https://example.com/frame2.png',
      'https://example.com/frame3.png',
    ],
  }),
};

// Registry of all mock adapters
export const mockAdapterRegistry = {
  'flux-pro': mockFluxProAdapter,
  'openai-image': mockOpenAIAdapter,
  'background-remover': mockBackgroundRemoverAdapter,
  'upscaler': mockUpscalerAdapter,
  'openai-text': mockOpenAITextAdapter,
  'luma': mockLumaAdapter,
  'sprite': mockSpriteAdapter,
};