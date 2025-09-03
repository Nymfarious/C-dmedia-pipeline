import { describe, it, expect } from 'vitest';
import { validateRecipe } from '@/pipeline/validate';
import { Recipe } from '@/pipeline/types';

describe('Pipeline Validator', () => {
  describe('validateRecipe', () => {
    it('should validate a correct recipe', () => {
      const recipe: Recipe = {
        id: 'valid-recipe',
        name: 'Valid Recipe',
        description: 'A valid test recipe',
        inputs: [
          {
            id: 'prompt',
            name: 'Prompt',
            type: 'text',
            required: true,
          },
        ],
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

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const recipe = {
        // Missing id, name, steps, outputs
        inputs: [],
      } as Recipe;

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
      expect(result.errors.some(e => e.includes('steps'))).toBe(true);
      expect(result.errors.some(e => e.includes('outputs'))).toBe(true);
    });

    it('should detect invalid provider', () => {
      const recipe: Recipe = {
        id: 'invalid-provider-recipe',
        name: 'Invalid Provider Recipe',
        inputs: [],
        steps: [
          {
            id: 'invalid-step',
            name: 'Invalid Step',
            provider: 'non-existent-provider',
            inputs: {},
          },
        ],
        outputs: {
          result: '$step.invalid-step.output',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Unknown provider'))).toBe(true);
    });

    it('should detect invalid input references', () => {
      const recipe: Recipe = {
        id: 'invalid-ref-recipe',
        name: 'Invalid Reference Recipe',
        inputs: [
          {
            id: 'valid_input',
            name: 'Valid Input',
            type: 'text',
            required: true,
          },
        ],
        steps: [
          {
            id: 'test-step',
            name: 'Test Step',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.non_existent_input',
              width: '$input.another_missing_input',
            },
          },
        ],
        outputs: {
          result: '$step.test-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non_existent_input'))).toBe(true);
      expect(result.errors.some(e => e.includes('another_missing_input'))).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const recipe: Recipe = {
        id: 'circular-recipe',
        name: 'Circular Recipe',
        inputs: [],
        steps: [
          {
            id: 'step-a',
            name: 'Step A',
            provider: 'flux-pro',
            inputs: {
              data: '$step.step-b.output',
            },
            dependencies: ['step-b'],
          },
          {
            id: 'step-b',
            name: 'Step B',
            provider: 'openai-image',
            inputs: {
              data: '$step.step-a.output',
            },
            dependencies: ['step-a'],
          },
        ],
        outputs: {
          result: '$step.step-a.output',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('circular'))).toBe(true);
    });

    it('should detect unreachable steps', () => {
      const recipe: Recipe = {
        id: 'unreachable-recipe',
        name: 'Unreachable Recipe',
        inputs: [
          {
            id: 'prompt',
            name: 'Prompt',
            type: 'text',
            required: true,
          },
        ],
        steps: [
          {
            id: 'main-step',
            name: 'Main Step',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.prompt',
            },
          },
          {
            id: 'unreachable-step',
            name: 'Unreachable Step',
            provider: 'openai-image',
            inputs: {
              prompt: 'isolated step',
            },
          },
        ],
        outputs: {
          result: '$step.main-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.warnings.some(w => w.includes('unreachable-step'))).toBe(true);
    });

    it('should validate step dependencies', () => {
      const recipe: Recipe = {
        id: 'dependency-recipe',
        name: 'Dependency Recipe',
        inputs: [],
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            provider: 'flux-pro',
            inputs: {
              prompt: 'test',
            },
          },
          {
            id: 'step-2',
            name: 'Step 2',
            provider: 'upscaler',
            inputs: {
              image: '$step.step-1.url',
            },
            dependencies: ['step-1'],
          },
          {
            id: 'step-3',
            name: 'Step 3',
            provider: 'background-remover',
            inputs: {
              image: '$step.non-existent-step.url',
            },
            dependencies: ['non-existent-step'],
          },
        ],
        outputs: {
          result: '$step.step-2.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non-existent-step'))).toBe(true);
    });

    it('should validate complex reference patterns', () => {
      const recipe: Recipe = {
        id: 'complex-ref-recipe',
        name: 'Complex Reference Recipe',
        inputs: [
          {
            id: 'config',
            name: 'Config Object',
            type: 'object',
            required: true,
          },
        ],
        steps: [
          {
            id: 'process-step',
            name: 'Process Step',
            provider: 'flux-pro',
            inputs: {
              prompt: '$input.config.prompt',
              width: '$input.config.dimensions.width',
              height: '$input.config.dimensions.height',
              previous: '$prev.output',
            },
          },
        ],
        outputs: {
          result: '$step.process-step.url',
          metadata: '$step.process-step.metadata',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(true);
    });

    it('should handle auto-fixes', () => {
      const recipe: Recipe = {
        id: 'fixable-recipe',
        name: 'Fixable Recipe',
        inputs: [
          {
            id: 'prompt',
            name: 'Prompt',
            type: 'text',
            required: true,
          },
        ],
        steps: [
          {
            id: 'generate-step',
            name: 'Generate Step',
            provider: 'flux-prov', // Typo in provider name
            inputs: {
              prompt: '$input.prompt',
            },
          },
        ],
        outputs: {
          result: '$step.generate-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.fixes.length).toBeGreaterThan(0);
      expect(result.fixes.some(f => f.description.includes('flux-pro'))).toBe(true);
    });

    it('should auto-insert matte removal for non-alpha models', () => {
      const recipe: Recipe = {
        id: 'non-alpha-recipe',
        name: 'Non-Alpha Recipe',
        inputs: [
          {
            id: 'prompt',
            name: 'Prompt',
            type: 'text',
            required: true,
          },
        ],
        steps: [
          {
            id: 'generate-step',
            name: 'Generate Step',
            provider: 'imageGen.nano-banana', // Model without alpha output
            operation: 'generate',
            inputs: {
              prompt: '$input.prompt',
              model: 'nano-banana',
            },
          },
        ],
        outputs: {
          result: '$step.generate-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.fixes.some(f => 
        f.description.includes('background removal') && 
        f.action === 'add'
      )).toBe(true);
    });

    it('should clamp image sizes to model limits', () => {
      const recipe: Recipe = {
        id: 'oversized-recipe',
        name: 'Oversized Recipe',
        inputs: [],
        steps: [
          {
            id: 'generate-step',
            name: 'Generate Step',
            provider: 'imageGen.nano-banana',
            operation: 'generate',
            inputs: {
              prompt: 'test',
              width: 3000,
              height: 3000,
              model: 'nano-banana',
            },
          },
        ],
        outputs: {
          result: '$step.generate-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.fixes.some(f => 
        f.path.includes('width') && 
        f.description.includes('Clamp')
      )).toBe(true);
      expect(result.fixes.some(f => 
        f.path.includes('height') && 
        f.description.includes('Clamp')
      )).toBe(true);
    });

    it('should strip LoRA params for unsupported models', () => {
      const recipe: Recipe = {
        id: 'lora-recipe',
        name: 'LoRA Recipe',
        inputs: [],
        steps: [
          {
            id: 'generate-step',
            name: 'Generate Step',
            provider: 'imageGen.nano-banana',
            operation: 'generate',
            inputs: {
              prompt: 'test',
              model: 'nano-banana',
              lora: 'some-lora-config',
            },
          },
        ],
        outputs: {
          result: '$step.generate-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.warnings.some(w => 
        w.code === 'LORA_NOT_SUPPORTED'
      )).toBe(true);
      expect(result.fixes.some(f => 
        f.path.includes('lora') && 
        f.action === 'remove'
      )).toBe(true);
    });

    it('should fail on incompatible operation-model combinations', () => {
      const recipe: Recipe = {
        id: 'incompatible-recipe',
        name: 'Incompatible Recipe',
        inputs: [],
        steps: [
          {
            id: 'invalid-step',
            name: 'Invalid Step',
            provider: 'imageGen.nano-banana',
            operation: 'video-generation', // Not supported by nano-banana
            inputs: {
              prompt: 'test',
              model: 'nano-banana',
            },
          },
        ],
        outputs: {
          result: '$step.invalid-step.url',
        },
      };

      const result = validateRecipe(recipe);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.code === 'INCOMPATIBLE_OPERATION'
      )).toBe(true);
    });
  });
});