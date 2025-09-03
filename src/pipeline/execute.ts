import { Recipe, Plan, ExecutionContext, ExecutionResult, ExecutableStep, Artifact, ExecutionError, StepStatus } from './types';
import { resolveReferences } from './refs';
import { validateRecipe } from './validate';
import { providers } from '@/adapters/registry';
import { circuitBreaker } from '@/middleware/circuitBreaker';

export class PipelineExecutor {
  private activeExecutions = new Map<string, ExecutionContext>();
  private cache = new Map<string, Artifact>();
  private readonly maxCacheSize = 1000;

  async executePlan(plan: Plan, inputs: Record<string, any>): Promise<ExecutionResult> {
    const startTime = Date.now();
    const context: ExecutionContext = {
      planId: plan.id,
      artifacts: new Map(),
      variables: new Map(Object.entries(inputs)),
      startTime,
      progress: {
        totalSteps: plan.steps.length,
        completedSteps: 0,
        errors: []
      }
    };

    this.activeExecutions.set(plan.id, context);

    try {
      // Execute steps in dependency order
      for (const batch of plan.dependencies.executionOrder) {
        await this.executeBatch(batch, plan, context);
      }

      // Collect outputs
      const outputs = await this.collectOutputs(plan, context);

      return {
        planId: plan.id,
        status: 'completed',
        outputs,
        artifacts: Array.from(context.artifacts.values()),
        duration: Date.now() - startTime,
        errors: context.progress.errors,
        stats: this.calculateStats(context)
      };

    } catch (error) {
      console.error('Pipeline execution failed:', error);
      
      return {
        planId: plan.id,
        status: 'failed',
        outputs: {},
        artifacts: Array.from(context.artifacts.values()),
        duration: Date.now() - startTime,
        errors: [
          ...context.progress.errors,
          {
            stepId: context.currentStep || 'unknown',
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
            retryable: false,
            retryCount: 0
          }
        ],
        stats: this.calculateStats(context)
      };
    } finally {
      this.activeExecutions.delete(plan.id);
    }
  }

  async executeBatch(stepIds: string[], plan: Plan, context: ExecutionContext): Promise<void> {
    const steps = stepIds.map(id => plan.steps.find(s => s.id === id)!);
    
    // Execute steps in parallel within the batch
    const promises = steps.map(step => this.executeStep(step, plan, context));
    await Promise.allSettled(promises);
  }

  async executeStep(step: ExecutableStep, plan: Plan, context: ExecutionContext): Promise<void> {
    context.currentStep = step.id;
    context.progress.currentStepId = step.id;
    
    try {
      // Check if step should be skipped due to condition
      if (await this.shouldSkipStep(step, context)) {
        step.status = 'skipped';
        return;
      }

      // Check cache first
      const cacheKey = this.getCacheKey(step);
      if (step.cache && this.cache.has(cacheKey)) {
        const cachedArtifact = this.cache.get(cacheKey)!;
        context.artifacts.set(step.id, { ...cachedArtifact, id: step.id });
        step.status = 'completed';
        context.progress.completedSteps++;
        return;
      }

      // Resolve input references
      const resolvedInputs = await resolveReferences(step.resolvedInputs, context);
      step.resolvedInputs = resolvedInputs;

      step.status = 'running';

      // Execute with retry logic
      const result = await this.executeWithRetry(step, resolvedInputs);

      // Store artifact
      const artifact: Artifact = {
        id: step.id,
        stepId: step.id,
        type: this.inferArtifactType(result),
        value: result,
        metadata: {
          providerUsed: step.provider,
          timestamp: new Date().toISOString(),
          cacheHit: false
        },
        createdAt: Date.now()
      };

      context.artifacts.set(step.id, artifact);

      // Cache if enabled
      if (step.cache) {
        this.cache.set(cacheKey, artifact);
        this.evictCacheIfNeeded();
      }

      step.status = 'completed';
      context.progress.completedSteps++;

    } catch (error) {
      step.status = 'failed';
      
      const executionError: ExecutionError = {
        stepId: step.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        retryable: step.retryCount < step.maxRetries,
        retryCount: step.retryCount
      };

      context.progress.errors.push(executionError);

      // Decide whether to fail the entire pipeline or continue
      if (!executionError.retryable) {
        throw error;
      }
    }
  }

  private async executeWithRetry(step: ExecutableStep, inputs: Record<string, any>): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
      try {
        step.retryCount = attempt;
        
        const adapter = this.getAdapter(step.provider);
        if (!adapter) {
          throw new Error(`Unknown provider: ${step.provider}`);
        }

        // Execute through circuit breaker
        const result = await circuitBreaker.execute(
          `${step.provider}-${step.operation}`,
          () => adapter[step.operation](inputs),
          () => this.getFallbackResult(step)
        );

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Calculate backoff delay
        if (attempt < step.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private getAdapter(providerId: string): any {
    const [category] = providerId.split('.');
    
    switch (category) {
      case 'imageGen':
        return providers.imageGen[providerId];
      case 'imageEdit':
        return providers.imageEdit[providerId];
      case 'textOverlay':
        return providers.textOverlay[providerId];
      case 'sound':
        return providers.sound[providerId];
      case 'videoGen':
        return providers.videoGen[providerId];
      case 'videoEdit':
        return providers.videoEdit[providerId];
      default:
        return null;
    }
  }

  private async shouldSkipStep(step: ExecutableStep, context: ExecutionContext): Promise<boolean> {
    // Implement conditional logic here
    // For now, always execute unless explicitly skipped
    return false;
  }

  private getCacheKey(step: ExecutableStep): string {
    const inputsHash = this.hashObject(step.resolvedInputs);
    return `${step.provider}-${step.operation}-${inputsHash}`;
  }

  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj, Object.keys(obj).sort()));
  }

  private inferArtifactType(result: any): 'asset' | 'data' | 'intermediate' {
    if (result && typeof result === 'object' && result.src && result.type) {
      return 'asset';
    }
    return 'data';
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFallbackResult(step: ExecutableStep): any {
    // Return a default/empty result for the step type
    const [category] = step.provider.split('.');
    
    switch (category) {
      case 'imageGen':
      case 'imageEdit':
        return {
          id: crypto.randomUUID(),
          src: '/placeholder.svg',
          type: 'image',
          name: 'fallback.png',
          createdAt: Date.now(),
          category: 'fallback'
        };
      default:
        return null;
    }
  }

  private evictCacheIfNeeded(): void {
    if (this.cache.size > this.maxCacheSize) {
      // Simple LRU eviction - remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private async collectOutputs(plan: Plan, context: ExecutionContext): Promise<Record<string, any>> {
    const outputs: Record<string, any> = {};
    
    // Find the recipe to get output definitions
    // For now, return all artifacts as outputs
    context.artifacts.forEach((artifact, stepId) => {
      outputs[stepId] = artifact.value;
    });

    return outputs;
  }

  private calculateStats(context: ExecutionContext) {
    const completed = context.progress.completedSteps;
    const failed = context.progress.errors.length;
    const total = context.progress.totalSteps;

    return {
      totalSteps: total,
      successfulSteps: completed,
      failedSteps: failed,
      skippedSteps: total - completed - failed,
      cacheHits: 0, // TODO: Track cache hits
      providerUsage: {} // TODO: Track provider usage
    };
  }

  // Public methods for external control
  async cancelExecution(planId: string): Promise<boolean> {
    const context = this.activeExecutions.get(planId);
    if (!context) return false;

    // Set cancellation flag
    (context as any).cancelled = true;
    this.activeExecutions.delete(planId);
    
    return true;
  }

  getExecutionProgress(planId: string) {
    const context = this.activeExecutions.get(planId);
    return context?.progress || null;
  }

  getAllActiveExecutions() {
    return Array.from(this.activeExecutions.keys());
  }
}

// Singleton instance
export const pipelineExecutor = new PipelineExecutor();