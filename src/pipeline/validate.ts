import { Recipe, ValidationResult, ValidationError, ValidationWarning, AutoFix } from './types';
import { providers } from '@/adapters/registry';

export function validateRecipe(recipe: Recipe): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const fixes: AutoFix[] = [];

  // Basic structure validation
  if (!recipe.id) {
    errors.push({
      path: 'id',
      message: 'Recipe must have an ID',
      code: 'MISSING_ID',
      severity: 'error'
    });
  }

  if (!recipe.name) {
    errors.push({
      path: 'name',
      message: 'Recipe must have a name',
      code: 'MISSING_NAME',
      severity: 'error'
    });
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    errors.push({
      path: 'steps',
      message: 'Recipe must have at least one step',
      code: 'NO_STEPS',
      severity: 'error'
    });
  }

  // Validate inputs
  if (recipe.inputs) {
    recipe.inputs.forEach((input, index) => {
      if (!input.id) {
        errors.push({
          path: `inputs[${index}].id`,
          message: 'Input must have an ID',
          code: 'MISSING_INPUT_ID',
          severity: 'error'
        });
      }

      if (!input.type) {
        errors.push({
          path: `inputs[${index}].type`,
          message: 'Input must have a type',
          code: 'MISSING_INPUT_TYPE',
          severity: 'error'
        });
        
        fixes.push({
          path: `inputs[${index}].type`,
          description: 'Set default input type to "text"',
          action: 'add',
          value: 'text'
        });
      }
    });
  }

  // Validate steps
  recipe.steps.forEach((step, index) => {
    validateStep(step, index, recipe, errors, warnings, fixes);
  });

  // Validate outputs
  if (recipe.outputs) {
    recipe.outputs.forEach((output, index) => {
      if (!output.id) {
        errors.push({
          path: `outputs[${index}].id`,
          message: 'Output must have an ID',
          code: 'MISSING_OUTPUT_ID',
          severity: 'error'
        });
      }

      if (!output.source) {
        errors.push({
          path: `outputs[${index}].source`,
          message: 'Output must have a source reference',
          code: 'MISSING_OUTPUT_SOURCE',
          severity: 'error'
        });
      }

      // Validate output reference
      if (output.source && !validateReference(output.source, recipe)) {
        errors.push({
          path: `outputs[${index}].source`,
          message: `Invalid reference: ${output.source}`,
          code: 'INVALID_OUTPUT_REFERENCE',
          severity: 'error'
        });
      }
    });
  }

  // Check for circular dependencies
  const circularDeps = findCircularDependencies(recipe);
  if (circularDeps.length > 0) {
    errors.push({
      path: 'steps',
      message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
      code: 'CIRCULAR_DEPENDENCY',
      severity: 'error'
    });
  }

  // Check for unreachable steps
  const unreachableSteps = findUnreachableSteps(recipe);
  unreachableSteps.forEach(stepId => {
    warnings.push({
      path: `steps`,
      message: `Step "${stepId}" may be unreachable`,
      code: 'UNREACHABLE_STEP',
      suggestion: 'Ensure this step is referenced by an output or another step'
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixes
  };
}

function validateStep(
  step: any,
  index: number,
  recipe: Recipe,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  fixes: AutoFix[]
): void {
  const basePath = `steps[${index}]`;

  // Required fields
  if (!step.id) {
    errors.push({
      path: `${basePath}.id`,
      message: 'Step must have an ID',
      code: 'MISSING_STEP_ID',
      severity: 'error'
    });
  }

  if (!step.provider) {
    errors.push({
      path: `${basePath}.provider`,
      message: 'Step must have a provider',
      code: 'MISSING_PROVIDER',
      severity: 'error'
    });
  }

  if (!step.operation) {
    errors.push({
      path: `${basePath}.operation`,
      message: 'Step must have an operation',
      code: 'MISSING_OPERATION',
      severity: 'error'
    });
  }

  // Validate provider exists
  if (step.provider && !isValidProvider(step.provider)) {
    errors.push({
      path: `${basePath}.provider`,
      message: `Unknown provider: ${step.provider}`,
      code: 'UNKNOWN_PROVIDER',
      severity: 'error'
    });

    // Suggest similar providers
    const suggestion = suggestSimilarProvider(step.provider);
    if (suggestion) {
      fixes.push({
        path: `${basePath}.provider`,
        description: `Did you mean "${suggestion}"?`,
        action: 'modify',
        value: suggestion
      });
    }
  }

  // Validate inputs and references
  if (step.inputs) {
    Object.entries(step.inputs).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('$')) {
        if (!validateReference(value, recipe)) {
          errors.push({
            path: `${basePath}.inputs.${key}`,
            message: `Invalid reference: ${value}`,
            code: 'INVALID_REFERENCE',
            severity: 'error'
          });
        }
      }
    });
  }

  // Validate retry configuration
  if (step.retries !== undefined && (step.retries < 0 || step.retries > 10)) {
    warnings.push({
      path: `${basePath}.retries`,
      message: 'Retry count should be between 0 and 10',
      code: 'INVALID_RETRY_COUNT',
      suggestion: 'Use a reasonable retry count (0-3 for most cases)'
    });
  }

  // Validate timeout
  if (step.timeout !== undefined && step.timeout < 1000) {
    warnings.push({
      path: `${basePath}.timeout`,
      message: 'Timeout should be at least 1000ms',
      code: 'SHORT_TIMEOUT',
      suggestion: 'Use a longer timeout for reliable execution'
    });
  }
}

function isValidProvider(providerId: string): boolean {
  const [category, provider] = providerId.split('.');
  
  switch (category) {
    case 'imageGen':
      return !!providers.imageGen[providerId];
    case 'imageEdit':
      return !!providers.imageEdit[providerId];
    case 'textOverlay':
      return !!providers.textOverlay[providerId];
    case 'sound':
      return !!providers.sound[providerId];
    case 'videoGen':
      return !!providers.videoGen[providerId];
    case 'videoEdit':
      return !!providers.videoEdit[providerId];
    default:
      return false;
  }
}

function suggestSimilarProvider(providerId: string): string | null {
  const allProviders = [
    ...Object.keys(providers.imageGen || {}),
    ...Object.keys(providers.imageEdit || {}),
    ...Object.keys(providers.textOverlay || {}),
    ...Object.keys(providers.sound || {}),
    ...Object.keys(providers.videoGen || {}),
    ...Object.keys(providers.videoEdit || {})
  ];

  // Simple Levenshtein distance for suggestions
  let bestMatch = null;
  let bestDistance = Infinity;

  allProviders.forEach(provider => {
    const distance = levenshteinDistance(providerId.toLowerCase(), provider.toLowerCase());
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = provider;
    }
  });

  return bestMatch;
}

function validateReference(ref: string, recipe: Recipe): boolean {
  if (!ref.startsWith('$')) return true;

  const parts = ref.slice(1).split('.');
  const [type, ...path] = parts;

  switch (type) {
    case 'input':
      const inputId = path[0];
      return recipe.inputs?.some(input => input.id === inputId) || false;
    
    case 'prev':
      return true; // $prev is always valid if there's a previous step
    
    case 'asset':
      return true; // Asset references are validated at runtime
    
    default:
      // Check if it's a step reference
      return recipe.steps.some(step => step.id === type);
  }
}

function findCircularDependencies(recipe: Recipe): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const stepMap = new Map(recipe.steps.map(step => [step.id, step]));

  function hasCycle(stepId: string, path: string[]): string[] | null {
    if (recursionStack.has(stepId)) {
      return [...path, stepId];
    }

    if (visited.has(stepId)) {
      return null;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = stepMap.get(stepId);
    if (step && step.inputs) {
      for (const value of Object.values(step.inputs)) {
        if (typeof value === 'string' && value.startsWith('$')) {
          const refStepId = value.slice(1).split('.')[0];
          if (stepMap.has(refStepId)) {
            const cycle = hasCycle(refStepId, [...path, stepId]);
            if (cycle) return cycle;
          }
        }
      }
    }

    recursionStack.delete(stepId);
    return null;
  }

  for (const step of recipe.steps) {
    const cycle = hasCycle(step.id, []);
    if (cycle) return cycle;
  }

  return [];
}

function findUnreachableSteps(recipe: Recipe): string[] {
  const referencedSteps = new Set<string>();
  
  // Mark steps referenced by outputs
  recipe.outputs?.forEach(output => {
    if (output.source.startsWith('$')) {
      const stepId = output.source.slice(1).split('.')[0];
      referencedSteps.add(stepId);
    }
  });

  // Mark steps referenced by other steps
  recipe.steps.forEach(step => {
    if (step.inputs) {
      Object.values(step.inputs).forEach(value => {
        if (typeof value === 'string' && value.startsWith('$')) {
          const refStepId = value.slice(1).split('.')[0];
          if (refStepId !== 'input' && refStepId !== 'prev' && refStepId !== 'asset') {
            referencedSteps.add(refStepId);
          }
        }
      });
    }
  });

  // Find unreferenced steps
  return recipe.steps
    .map(step => step.id)
    .filter(stepId => !referencedSteps.has(stepId));
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export function applyAutoFixes(recipe: Recipe, fixes: AutoFix[]): Recipe {
  const fixedRecipe = JSON.parse(JSON.stringify(recipe));

  fixes.forEach(fix => {
    const pathParts = fix.path.split('.');
    let target = fixedRecipe;

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        target = target[arrayName][parseInt(index)];
      } else {
        target = target[part];
      }
    }

    // Apply the fix
    const lastPart = pathParts[pathParts.length - 1];
    const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      switch (fix.action) {
        case 'add':
        case 'modify':
          target[arrayName][parseInt(index)] = fix.value;
          break;
        case 'remove':
          target[arrayName].splice(parseInt(index), 1);
          break;
      }
    } else {
      switch (fix.action) {
        case 'add':
        case 'modify':
          target[lastPart] = fix.value;
          break;
        case 'remove':
          delete target[lastPart];
          break;
      }
    }
  });

  return fixedRecipe;
}