import { Recipe, Plan, ExecutionContext, ExecutionResult, ExecutableStep, Artifact, ExecutionError, StepStatus, DraftOptions, StructuredLog } from './types';
import { resolveReferences } from './refs';
import { validateRecipe } from './validate';
import { providers } from '@/adapters/registry';
import { circuitBreaker } from '@/middleware/circuitBreaker';
import { MODELS, getModel } from '@/models/registry';

export class PipelineExecutor {
  private activeExecutions = new Map<string, ExecutionContext>();
  private cache = new Map<string, Artifact>();
  private readonly maxCacheSize = 1000;
  private logs: StructuredLog[] = [];
  private readonly maxLogSize = 10000;

  async executePlan(plan: Plan, inputs: Record<string, any>, options?: { draft?: DraftOptions }): Promise<ExecutionResult> {
    const startTime = Date.now();
    const context: ExecutionContext = {
      planId: plan.id,
      artifacts: new Map(),
      variables: new Map(Object.entries(inputs)),
      startTime,
      draftOptions: options?.draft,
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

      // Check content-addressed cache first
      const cacheKey = this.getCacheKey(step, context);
      if (step.cache && this.cache.has(cacheKey)) {
        const cachedArtifact = this.cache.get(cacheKey)!;
        context.artifacts.set(step.id, { ...cachedArtifact, id: step.id });
        step.status = 'completed';
        context.progress.completedSteps++;
        
        this.logStep(step, context, 0, 'completed', null, true);
        return;
      }

      // Resolve input references
      const resolvedInputs = await resolveReferences(step.resolvedInputs, context);
      
      // Apply draft mode overrides
      const finalInputs = this.applyDraftOverrides(resolvedInputs, step, context);
      step.resolvedInputs = finalInputs;

      step.status = 'running';
      const stepStartTime = Date.now();

      // Execute with retry logic
      const result = await this.executeWithRetry(step, finalInputs);

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
      
      // Log successful execution
      this.logStep(step, context, Date.now() - stepStartTime, 'completed', result);

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
      
      // Log failed execution
      this.logStep(step, context, 0, 'failed', null, false, error.message);

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
      case 'animate':
        return providers.animate[providerId];
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

  private getCacheKey(step: ExecutableStep, context: ExecutionContext): string {
    // Content-addressed cache with normalized parameters
    const normalizedInputs = this.normalizeInputs(step.resolvedInputs);
    const inputsHash = this.hashObject(normalizedInputs);
    const seed = normalizedInputs.seed || 'default';
    const modelVersion = this.getModelVersion(step);
    
    return `${step.provider}-${step.operation}-${modelVersion}-${seed}-${inputsHash}`;
  }
  
  private normalizeInputs(inputs: Record<string, any>): Record<string, any> {
    // Sort keys and normalize values for consistent hashing
    const normalized: Record<string, any> = {};
    const sortedKeys = Object.keys(inputs).sort();
    
    for (const key of sortedKeys) {
      const value = inputs[key];
      if (typeof value === 'object' && value !== null) {
        normalized[key] = JSON.parse(JSON.stringify(value, Object.keys(value).sort()));
      } else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }
  
  private getModelVersion(step: ExecutableStep): string {
    const modelKey = step.resolvedInputs?.model || step.provider?.split('.')[1] || 'flux-pro';
    const modelSpec = MODELS[modelKey as keyof typeof MODELS];
    return modelSpec?.model || 'unknown';
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
  
  private applyDraftOverrides(inputs: Record<string, any>, step: ExecutableStep, context: ExecutionContext): Record<string, any> {
    if (!context.draftOptions?.enabled) return inputs;
    
    const draftInputs = { ...inputs };
    const options = context.draftOptions;
    
    // Reduce image dimensions
    if (draftInputs.width && options.sizeReduction) {
      draftInputs.width = Math.floor(draftInputs.width * options.sizeReduction);
    }
    if (draftInputs.height && options.sizeReduction) {
      draftInputs.height = Math.floor(draftInputs.height * options.sizeReduction);
    }
    
    // Reduce inference steps
    if (draftInputs.steps && options.stepReduction) {
      draftInputs.steps = Math.max(1, Math.floor(draftInputs.steps * options.stepReduction));
    }
    
    // Use faster models
    if (options.useFasterModels && step.provider.includes('flux')) {
      draftInputs.model = 'flux-schnell'; // Faster variant
    }
    
    return draftInputs;
  }
  
  private logStep(
    step: ExecutableStep, 
    context: ExecutionContext, 
    duration: number, 
    status: StepStatus, 
    result?: any, 
    cacheHit: boolean = false,
    error?: string
  ): void {
    const log: StructuredLog = {
      trace: `${context.planId}.${step.id}`,
      op: step.operation,
      adapter: step.provider,
      model_used: step.resolvedInputs?.model || 'default',
      duration_ms: duration,
      status,
      cache_hit: cacheHit,
      timestamp: Date.now()
    };
    
    if (result?.url) {
      log.artifacts = { [step.operation]: result.url };
    }
    
    if (error) {
      log.error = error;
    }
    
    this.logs.push(log);
    this.evictLogsIfNeeded();
  }
  
  private evictLogsIfNeeded(): void {
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogSize * 0.8));
    }
  }
  
  // Public method to access structured logs
  getStructuredLogs(planId?: string): StructuredLog[] {
    if (planId) {
      return this.logs.filter(log => log.trace.startsWith(planId));
    }
    return [...this.logs];
  }
}

// Singleton instance
export const pipelineExecutor = new PipelineExecutor();