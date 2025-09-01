interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class CircuitBreaker {
  private states = new Map<string, CircuitBreakerState>();
  private failureThreshold: number;
  private timeoutWindow: number;
  private retryAfter: number;

  constructor(
    failureThreshold = 5,
    timeoutWindow = 60000,
    retryAfter = 30000
  ) {
    this.failureThreshold = failureThreshold;
    this.timeoutWindow = timeoutWindow;
    this.retryAfter = retryAfter;
  }

  private getState(key: string): CircuitBreakerState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
      });
    }
    return this.states.get(key)!;
  }

  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(key);
    const now = Date.now();

    // Check if circuit is open
    if (state.state === 'OPEN') {
      if (now - state.lastFailureTime < this.retryAfter) {
        console.log(`Circuit breaker OPEN for ${key}, using fallback`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${key}. Service temporarily unavailable.`);
      }
      // Try to close circuit
      state.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (state.state === 'HALF_OPEN') {
        console.log(`Circuit breaker closing for ${key} - service recovered`);
        state.state = 'CLOSED';
        state.failures = 0;
      }
      
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailureTime = now;

      // Open circuit if threshold reached
      if (state.failures >= this.failureThreshold) {
        console.log(`Circuit breaker OPENING for ${key} - failure threshold reached`);
        state.state = 'OPEN';
      }

      if (fallback && state.state === 'OPEN') {
        console.log(`Using fallback for ${key} due to circuit breaker`);
        return fallback();
      }

      throw error;
    }
  }

  getStats(key: string) {
    const state = this.getState(key);
    return {
      state: state.state,
      failures: state.failures,
      lastFailureTime: state.lastFailureTime
    };
  }
}

export const circuitBreaker = new CircuitBreaker();