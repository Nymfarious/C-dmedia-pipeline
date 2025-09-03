interface AdapterHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  latency_ms: number;
  last_check: string;
  error?: string;
}

interface OverallHealth {
  status: 'healthy' | 'degraded' | 'failed';
  adapters: AdapterHealth[];
  summary: {
    healthy: number;
    degraded: number;
    failed: number;
  };
  timestamp: string;
}

export class AdapterHealthMonitor {
  private adapters = [
    { name: 'replicate-flux', endpoint: '/api/replicate' },
    { name: 'openai-dalle', endpoint: '/api/openai-image' },
    { name: 'gemini-nano', endpoint: '/api/gemini-nano' },
    { name: 'seed-edit', endpoint: '/api/unified' },
    { name: 'background-removal', endpoint: '/api/unified' },
    { name: 'rendering-png', endpoint: '/api/render/png' },
    { name: 'rendering-pdf', endpoint: '/api/render/pdf' }
  ];

  async checkOverallHealth(): Promise<OverallHealth> {
    const adapters = await this.checkAllAdapters();
    
    const summary = adapters.reduce(
      (acc, adapter) => {
        acc[adapter.status]++;
        return acc;
      },
      { healthy: 0, degraded: 0, failed: 0 }
    );

    let overallStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
    if (summary.failed > 0) {
      overallStatus = 'failed';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      adapters,
      summary,
      timestamp: new Date().toISOString()
    };
  }

  async checkAllAdapters(): Promise<AdapterHealth[]> {
    const checks = this.adapters.map(adapter => this.checkAdapter(adapter.name));
    const results = await Promise.allSettled(checks);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      } else {
        return {
          name: this.adapters[index].name,
          status: 'failed' as const,
          latency_ms: 0,
          last_check: new Date().toISOString(),
          error: result.status === 'rejected' ? String(result.reason) : 'Unknown error'
        };
      }
    });
  }

  async checkAdapter(name: string): Promise<AdapterHealth | null> {
    const adapter = this.adapters.find(a => a.name === name);
    if (!adapter) return null;

    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      let status: 'healthy' | 'degraded' | 'failed' = 'failed';
      let error: string | undefined;

      // Perform health check based on adapter type
      switch (name) {
        case 'replicate-flux':
          status = await this.checkReplicateHealth();
          break;
        case 'openai-dalle':
          status = await this.checkOpenAIHealth();
          break;
        case 'gemini-nano':
          status = await this.checkGeminiHealth();
          break;
        case 'rendering-png':
        case 'rendering-pdf':
          status = await this.checkRenderingHealth(name);
          break;
        default:
          status = await this.checkGenericEndpoint(adapter.endpoint);
      }

      const latency = Date.now() - startTime;

      // Determine status based on latency
      if (status === 'healthy' && latency > 5000) {
        status = 'degraded';
        error = 'High latency detected';
      }

      return {
        name,
        status,
        latency_ms: latency,
        last_check: timestamp,
        error
      };

    } catch (err) {
      return {
        name,
        status: 'failed',
        latency_ms: Date.now() - startTime,
        last_check: timestamp,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  private async checkReplicateHealth(): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      // Check if Replicate API key is available
      if (!process.env.REPLICATE_API_TOKEN) {
        return 'failed';
      }

      // Try a simple API call to check connectivity
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok ? 'healthy' : 'failed';
    } catch (error) {
      return 'failed';
    }
  }

  private async checkOpenAIHealth(): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return 'failed';
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok ? 'healthy' : 'failed';
    } catch (error) {
      return 'failed';
    }
  }

  private async checkGeminiHealth(): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      // Since Gemini is being deprecated, always return degraded
      return 'degraded';
    } catch (error) {
      return 'failed';
    }
  }

  private async checkRenderingHealth(service: string): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      // Check if we can create a simple test render
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const endpoint = service === 'rendering-png' ? '/api/render/health' : '/api/render/health';
      
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy' ? 'healthy' : 'degraded';
      }
      
      return 'failed';
    } catch (error) {
      return 'failed';
    }
  }

  private async checkGenericEndpoint(endpoint: string): Promise<'healthy' | 'degraded' | 'failed'> {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);

      return response.ok ? 'healthy' : 'failed';
    } catch (error) {
      return 'failed';
    }
  }
}