// Robust API client with proper error handling for JSON responses

export async function safeApiCall(url: string, options?: RequestInit): Promise<any | null> {
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