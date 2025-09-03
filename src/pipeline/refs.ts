import { ExecutionContext, Reference, ResolvedReference } from './types';

export async function resolveReferences(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(inputs)) {
    resolved[key] = await resolveValue(value, context);
  }

  return resolved;
}

async function resolveValue(value: any, context: ExecutionContext): Promise<any> {
  if (typeof value === 'string' && value.startsWith('$')) {
    return resolveReference(value, context);
  }
  
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => resolveValue(item, context)));
  }
  
  if (value && typeof value === 'object') {
    const resolved: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = await resolveValue(v, context);
    }
    return resolved;
  }
  
  return value;
}

export async function resolveReference(
  ref: string,
  context: ExecutionContext
): Promise<any> {
  const reference = parseReference(ref);
  
  switch (reference.type) {
    case 'input':
      return resolveInputReference(reference, context);
    case 'step':
      return resolveStepReference(reference, context);
    case 'prev':
      return resolvePrevReference(reference, context);
    case 'asset':
      return resolveAssetReference(reference, context);
    case 'variable':
      return resolveVariableReference(reference, context);
    default:
      throw new Error(`Unknown reference type: ${reference.type}`);
  }
}

function parseReference(ref: string): Reference {
  if (!ref.startsWith('$')) {
    throw new Error(`Invalid reference format: ${ref}`);
  }

  const withoutDollar = ref.slice(1);
  const parts = withoutDollar.split('.');
  const [first, ...pathParts] = parts;

  // Determine reference type
  if (first === 'input') {
    return {
      type: 'input',
      source: pathParts[0],
      path: pathParts.slice(1).join('.')
    };
  }
  
  if (first === 'prev') {
    return {
      type: 'prev',
      source: 'prev',
      path: pathParts.join('.')
    };
  }
  
  if (first.startsWith('asset')) {
    return {
      type: 'asset',
      source: first,
      path: pathParts.join('.')
    };
  }

  // Default to step reference
  return {
    type: 'step',
    source: first,
    path: pathParts.join('.')
  };
}

function resolveInputReference(ref: Reference, context: ExecutionContext): any {
  const value = context.variables.get(ref.source);
  
  if (value === undefined) {
    throw new Error(`Input not found: ${ref.source}`);
  }
  
  return ref.path ? getNestedValue(value, ref.path) : value;
}

function resolveStepReference(ref: Reference, context: ExecutionContext): any {
  const artifact = context.artifacts.get(ref.source);
  
  if (!artifact) {
    throw new Error(`Step artifact not found: ${ref.source}`);
  }
  
  const value = artifact.value;
  return ref.path ? getNestedValue(value, ref.path) : value;
}

function resolvePrevReference(ref: Reference, context: ExecutionContext): any {
  // Find the most recent artifact (previous step output)
  const artifacts = Array.from(context.artifacts.values());
  artifacts.sort((a, b) => b.createdAt - a.createdAt);
  
  if (artifacts.length === 0) {
    throw new Error('No previous step found for $prev reference');
  }
  
  const prevArtifact = artifacts[0];
  const value = prevArtifact.value;
  
  return ref.path ? getNestedValue(value, ref.path) : value;
}

function resolveAssetReference(ref: Reference, context: ExecutionContext): any {
  // Asset references are typically resolved by the application layer
  // For now, return the reference as-is for the renderer to handle
  return `$${ref.source}${ref.path ? '.' + ref.path : ''}`;
}

function resolveVariableReference(ref: Reference, context: ExecutionContext): any {
  const value = context.variables.get(ref.source);
  
  if (value === undefined) {
    throw new Error(`Variable not found: ${ref.source}`);
  }
  
  return ref.path ? getNestedValue(value, ref.path) : value;
}

function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      throw new Error(`Cannot access property '${key}' of ${current}`);
    }
    
    // Handle array indices
    if (Array.isArray(current)) {
      const index = parseInt(key);
      if (isNaN(index) || index < 0 || index >= current.length) {
        throw new Error(`Array index out of bounds: ${key}`);
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = current[key];
    } else {
      throw new Error(`Cannot access property '${key}' of ${typeof current}`);
    }
  }
  
  return current;
}

export function validateReference(ref: string): boolean {
  try {
    parseReference(ref);
    return true;
  } catch {
    return false;
  }
}

export function extractReferences(obj: any): string[] {
  const refs: string[] = [];
  
  function extract(value: any): void {
    if (typeof value === 'string' && value.startsWith('$')) {
      refs.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(extract);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(extract);
    }
  }
  
  extract(obj);
  return [...new Set(refs)]; // Remove duplicates
}

export function replaceReferences(
  obj: any,
  replacements: Record<string, any>
): any {
  if (typeof obj === 'string' && obj.startsWith('$')) {
    return replacements[obj] ?? obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceReferences(item, replacements));
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceReferences(value, replacements);
    }
    return result;
  }
  
  return obj;
}