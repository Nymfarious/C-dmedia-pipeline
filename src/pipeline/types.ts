import { Asset, PipelineStep } from '@/types/media';

// Enhanced pipeline types for deterministic execution
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  version: string;
  inputs: RecipeInput[];
  steps: RecipeStep[];
  outputs: RecipeOutput[];
  metadata?: Record<string, any>;
}

export interface RecipeInput {
  id: string;
  name: string;
  type: 'asset' | 'text' | 'number' | 'boolean' | 'object';
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface RecipeStep {
  id: string;
  name?: string;
  provider: string; // e.g., "replicate.sdxl", "openai.dall-e"
  operation: string; // e.g., "generate", "edit", "upscale"
  inputs: Record<string, any>; // Can include $ references
  outputs?: string[]; // Output variable names
  condition?: string; // Conditional execution
  retries?: number;
  timeout?: number;
  cache?: boolean;
}

export interface RecipeOutput {
  id: string;
  name: string;
  source: string; // $ reference to step output
  description?: string;
}

export interface Plan {
  id: string;
  recipeId: string;
  steps: ExecutableStep[];
  dependencies: DependencyGraph;
  estimatedDuration?: number;
  createdAt: number;
}

export interface ExecutableStep {
  id: string;
  stepId: string; // Reference to RecipeStep
  provider: string;
  operation: string;
  resolvedInputs: Record<string, any>; // $ references resolved
  dependencies: string[]; // Step IDs this depends on
  status: StepStatus;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  cache: boolean;
}

export interface DependencyGraph {
  nodes: string[]; // Step IDs
  edges: Array<[string, string]>; // [from, to]
  executionOrder: string[][];
}

export interface Artifact {
  id: string;
  stepId: string;
  type: 'asset' | 'data' | 'intermediate';
  value: any;
  metadata: ArtifactMetadata;
  createdAt: number;
  expiresAt?: number;
}

export interface ArtifactMetadata {
  size?: number;
  mimeType?: string;
  duration?: number;
  cacheHit?: boolean;
  providerUsed?: string;
  cost?: number;
  [key: string]: any;
}

export interface ExecutionContext {
  planId: string;
  artifacts: Map<string, Artifact>;
  variables: Map<string, any>;
  currentStep?: string;
  startTime: number;
  progress: ExecutionProgress;
  draftOptions?: DraftOptions;
}

export interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  currentStepId?: string;
  currentStepName?: string;
  estimatedTimeRemaining?: number;
  errors: ExecutionError[];
}

export interface ExecutionError {
  stepId: string;
  error: string;
  timestamp: number;
  retryable: boolean;
  retryCount: number;
}

export interface ExecutionResult {
  planId: string;
  status: 'completed' | 'failed' | 'cancelled';
  outputs: Record<string, any>;
  artifacts: Artifact[];
  duration: number;
  errors: ExecutionError[];
  stats: ExecutionStats;
}

export interface ExecutionStats {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  skippedSteps: number;
  cacheHits: number;
  totalCost?: number;
  providerUsage: Record<string, number>;
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

// Reference resolution types
export interface Reference {
  type: 'step' | 'input' | 'asset' | 'prev' | 'variable';
  source: string;
  path?: string; // For nested access like $step.output.url
}

export interface ResolvedReference {
  reference: Reference;
  value: any;
  resolved: boolean;
  error?: string;
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Max artifacts to cache
  evictionPolicy: 'lru' | 'fifo' | 'ttl';
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixes: AutoFix[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface AutoFix {
  path: string;
  description: string;
  action: 'add' | 'remove' | 'modify';
  value?: any;
}

// Model constraint validation
export interface ModelConstraint {
  modelKey: string;
  modes: string[];
  maxSize?: [number, number];
  supportsAlpha?: boolean;
  supportsLora?: boolean;
}

// Draft execution options
export interface DraftOptions {
  enabled: boolean;
  sizeReduction: number; // 0.5 = 50% reduction
  stepReduction: number; // 0.5 = 50% fewer steps
  useFasterModels: boolean;
  skipPostProcessing: boolean;
}

// Enhanced execution context
export interface StructuredLog {
  trace: string;
  op: string;
  adapter: string;
  model_used?: string;
  duration_ms: number;
  status: StepStatus;
  artifacts?: Record<string, string>;
  cache_hit?: boolean;
  error?: string;
  timestamp: number;
}

// Monitor types for debug panel
export interface AdapterHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'failed';
  latency: number;
  errorRate: number;
  lastCheck: number;
  errors: string[];
}

export interface JobExecution {
  id: string;
  planId: string;
  recipeName: string;
  status: StepStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  stepsCompleted: number;
  totalSteps: number;
  errors: ExecutionError[];
}

export interface StepLog {
  stepId: string;
  planId: string;
  provider: string;
  operation: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  duration: number;
  status: StepStatus;
  error?: string;
  timestamp: number;
}