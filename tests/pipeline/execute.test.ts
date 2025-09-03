import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineExecutor } from '@/pipeline/execute';
import { Plan, ExecutableStep } from '@/pipeline/types';
import { mockAdapterRegistry } from '../mocks/adapters';

// Mock the adapter registry
vi.mock('@/adapters/registry', () => ({
  getAdapter: vi.fn((providerId: string) => mockAdapterRegistry[providerId]),
}));

describe('Pipeline Executor', () => {
  let executor: PipelineExecutor;

  beforeEach(() => {
    executor = new PipelineExecutor();
    vi.clearAllMocks();
  });

  describe('executePlan', () => {
    it('should execute a simple plan with one step', async () => {
      const plan: Plan = {
        id: 'simple-plan',
        name: 'Simple Plan',
        steps: [
          {
            id: 'generate-image',
            name: 'Generate Image',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
              width: 1024,
              height: 1024,
            },
          },
        ],
        outputs: {
          image: '$step.generate-image.url',
        },
      };

      const inputs = {
        prompt: 'A beautiful sunset over mountains',
      };

      const result = await executor.executePlan(plan, inputs);

      expect(result.success).toBe(true);
      expect(result.outputs.image).toBe('https://example.com/generated-image.png');
      expect(mockAdapterRegistry['flux-pro'].generateImage).toHaveBeenCalledWith({
        prompt: 'A beautiful sunset over mountains',
        width: 1024,
        height: 1024,
      });
    });

    it('should execute a plan with multiple dependent steps', async () => {
      const plan: Plan = {
        id: 'multi-step-plan',
        name: 'Multi Step Plan',
        steps: [
          {
            id: 'generate-base',
            name: 'Generate Base Image',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
              width: 512,
              height: 512,
            },
          },
          {
            id: 'upscale-image',
            name: 'Upscale Image',
            provider: 'upscaler',
            inputs: {
              image: '$step.generate-base.url',
              scale: 2,
            },
            dependencies: ['generate-base'],
          },
        ],
        outputs: {
          original: '$step.generate-base.url',
          upscaled: '$step.upscale-image.url',
        },
      };

      const inputs = {
        prompt: 'A detailed landscape',
      };

      const result = await executor.executePlan(plan, inputs);

      expect(result.success).toBe(true);
      expect(result.outputs.original).toBe('https://example.com/generated-image.png');
      expect(result.outputs.upscaled).toBe('https://example.com/upscaled-image.png');
      
      // Check that steps were called in correct order
      expect(mockAdapterRegistry['flux-pro'].generateImage).toHaveBeenCalled();
      expect(mockAdapterRegistry['upscaler'].upscale).toHaveBeenCalledWith({
        image: 'https://example.com/generated-image.png',
        scale: 2,
      });
    });

    it('should execute parallel steps without dependencies', async () => {
      const plan: Plan = {
        id: 'parallel-plan',
        name: 'Parallel Plan',
        steps: [
          {
            id: 'generate-image1',
            name: 'Generate Image 1',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt1',
              width: 512,
              height: 512,
            },
          },
          {
            id: 'generate-image2',
            name: 'Generate Image 2',
            provider: 'openai-image',
            inputs: {
              prompt: '$input.prompt2',
              width: 512,
              height: 512,
            },
          },
        ],
        outputs: {
          image1: '$step.generate-image1.url',
          image2: '$step.generate-image2.url',
        },
      };

      const inputs = {
        prompt1: 'A cat',
        prompt2: 'A dog',
      };

      const result = await executor.executePlan(plan, inputs);

      expect(result.success).toBe(true);
      expect(result.outputs.image1).toBe('https://example.com/generated-image.png');
      expect(result.outputs.image2).toBe('https://example.com/openai-image.png');
      expect(mockAdapterRegistry['flux-pro'].generateImage).toHaveBeenCalled();
      expect(mockAdapterRegistry['openai-image'].generateImage).toHaveBeenCalled();
    });

    it('should handle step failures gracefully', async () => {
      // Mock an adapter to fail
      mockAdapterRegistry['flux-pro'].generateImage.mockRejectedValueOnce(
        new Error('Generation failed')
      );

      const plan: Plan = {
        id: 'failing-plan',
        name: 'Failing Plan',
        steps: [
          {
            id: 'failing-step',
            name: 'Failing Step',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
            },
          },
        ],
        outputs: {
          image: '$step.failing-step.url',
        },
      };

      const inputs = {
        prompt: 'Test prompt',
      };

      const result = await executor.executePlan(plan, inputs);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Generation failed');
    });

    it('should use caching for repeated operations', async () => {
      const plan: Plan = {
        id: 'cached-plan',
        name: 'Cached Plan',
        steps: [
          {
            id: 'generate-image',
            name: 'Generate Image',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
              width: 512,
              height: 512,
            },
            cache: true,
          },
        ],
        outputs: {
          image: '$step.generate-image.url',
        },
      };

      const inputs = {
        prompt: 'Cached prompt',
      };

      // Execute the plan twice
      const result1 = await executor.executePlan(plan, inputs);
      const result2 = await executor.executePlan(plan, inputs);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.outputs.image).toBe(result2.outputs.image);
      
      // Adapter should only be called once due to caching
      expect(mockAdapterRegistry['flux-pro'].generateImage).toHaveBeenCalledTimes(1);
    });
  });

  describe('execution control', () => {
    it('should cancel execution', async () => {
      const plan: Plan = {
        id: 'long-plan',
        name: 'Long Running Plan',
        steps: [
          {
            id: 'long-step',
            name: 'Long Step',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
            },
          },
        ],
        outputs: {
          image: '$step.long-step.url',
        },
      };

      // Mock a slow operation
      mockAdapterRegistry['flux-pro'].generateImage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const inputs = { prompt: 'Test' };
      
      // Start execution
      const executionPromise = executor.executePlan(plan, inputs);
      
      // Cancel after a short delay
      setTimeout(() => {
        executor.cancelExecution('long-plan');
      }, 100);

      const result = await executionPromise;
      expect(result.success).toBe(false);
    });

    it('should track execution progress', async () => {
      const plan: Plan = {
        id: 'progress-plan',
        name: 'Progress Plan',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            provider: 'flux-pro',
            inputs: { prompt: 'test' },
          },
          {
            id: 'step2',
            name: 'Step 2',
            provider: 'openai-image',
            inputs: { prompt: 'test' },
          },
        ],
        outputs: {
          result: '$step.step2.url',
        },
      };

      const inputs = { prompt: 'Test' };
      
      // Start execution
      const executionPromise = executor.executePlan(plan, inputs);
      
      // Check progress
      const progress = executor.getExecutionProgress('progress-plan');
      expect(progress).toBeDefined();
      
      await executionPromise;
    });
  });
});