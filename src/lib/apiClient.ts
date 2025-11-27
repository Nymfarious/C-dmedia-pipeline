// Robust API client with proper error handling for JSON responses

// Stub mode - returns mock data when backend is unavailable
const STUB_MODE = true;

export async function safeApiCall(url: string, options?: RequestInit): Promise<any | null> {
  // Return stub data if stub mode is enabled
  if (STUB_MODE) {
    console.log(`[STUB MODE] API call to ${url} - returning mock data`);
    
    if (url.includes('/api/health')) {
      return { ok: true, timestamp: Date.now() };
    }
    
    if (url.includes('/api/jobs')) {
      return [];
    }
    
    // Default stub response
    return { ok: true, stub: true, message: 'Stub response - backend not configured' };
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    
    if (!response.ok) {
      const text = await response.text();
      console.warn(`API call failed for ${url}: HTTP ${response.status}: ${text.slice(0, 200)}...`);
      return null;
    }
    
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`Expected JSON from ${url}, got ${contentType}. Body: ${text.slice(0, 200)}...`);
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.warn(`Network error for ${url}:`, error);
    return null;
  }
}

export async function getApiUrl(endpoint: string): Promise<string> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 
                  (import.meta.env.DEV ? 'http://localhost:3001' : '');
  return `${baseUrl}${endpoint}`;
}

export async function healthCheck(): Promise<{ ok: boolean; timestamp?: number } | null> {
  const url = await getApiUrl('/api/health');
  return safeApiCall(url);
}

export async function getJobs(): Promise<any[] | null> {
  const url = await getApiUrl('/api/jobs');
  return safeApiCall(url);
}