// Centralized API configuration
export const API_CONFIG = {
  // Use relative URL for same-origin requests in production, localhost for development
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : ''),
  
  ENDPOINTS: {
    IMAGE: {
      GENERATE: '/api/image/generate',
      EDIT: '/api/image/edit',
      IMG2IMG: '/api/image/img2img',
      BG_REMOVE: '/api/image/bg-remove',
      UPSCALE: '/api/image/upscale',
      SVG: '/api/image/svg',
    },
    VIDEO: {
      I2V: '/api/video/i2v',
    },
    AUDIO: {
      TTS: '/api/audio/tts',
    },
  },
} as const;

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Helper function to make authenticated requests
export async function makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers: defaultHeaders,
  });
}