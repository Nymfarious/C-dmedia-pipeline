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
    UNIFIED: '/api/unified', // Add unified endpoint
  },
} as const;

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Stub mode for API requests when backend is unavailable
const STUB_MODE = true;

// Helper function to make authenticated requests with JSON response parsing
export async function makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<{success: boolean, data?: any, error?: string}> {
  // Return stub response if stub mode is enabled
  if (STUB_MODE) {
    console.log(`[STUB MODE] API request to ${endpoint} - returning mock response`);
    return { 
      success: true, 
      data: { 
        stub: true, 
        message: 'Stub response - backend not configured',
        endpoint 
      } 
    };
  }

  const url = getApiUrl(endpoint);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.message || response.statusText };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}