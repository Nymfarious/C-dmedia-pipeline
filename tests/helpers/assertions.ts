import { expect } from 'vitest';

export function expectArrayBuffer(value: any, minSize = 0): void {
  expect(value).toBeInstanceOf(ArrayBuffer);
  if (minSize > 0) {
    expect(value.byteLength).toBeGreaterThanOrEqual(minSize);
  }
}

export function expectImageDimensions(
  dimensions: { width: number; height: number },
  expectedWidth?: number,
  expectedHeight?: number
): void {
  expect(dimensions).toHaveProperty('width');
  expect(dimensions).toHaveProperty('height');
  expect(typeof dimensions.width).toBe('number');
  expect(typeof dimensions.height).toBe('number');
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
  
  if (expectedWidth !== undefined) {
    expect(dimensions.width).toBe(expectedWidth);
  }
  if (expectedHeight !== undefined) {
    expect(dimensions.height).toBe(expectedHeight);
  }
}

export function expectValidUrl(url: string): void {
  expect(typeof url).toBe('string');
  expect(url.length).toBeGreaterThan(0);
  expect(() => new URL(url)).not.toThrow();
}

export function expectValidDataUrl(dataUrl: string, mimeType?: string): void {
  expect(typeof dataUrl).toBe('string');
  expect(dataUrl).toMatch(/^data:/);
  
  if (mimeType) {
    expect(dataUrl).toMatch(new RegExp(`^data:${mimeType.replace('/', '\\/')}`));
  }
}

export function expectTemplateStructure(template: any): void {
  expect(template).toHaveProperty('id');
  expect(template).toHaveProperty('name');
  expect(template).toHaveProperty('canvas');
  expect(template).toHaveProperty('layers');
  expect(template).toHaveProperty('inputs');
  
  expect(typeof template.id).toBe('string');
  expect(typeof template.name).toBe('string');
  expect(Array.isArray(template.layers)).toBe(true);
  expect(Array.isArray(template.inputs)).toBe(true);
  
  // Validate canvas structure
  expect(template.canvas).toHaveProperty('width');
  expect(template.canvas).toHaveProperty('height');
  expect(typeof template.canvas.width).toBe('number');
  expect(typeof template.canvas.height).toBe('number');
}

export function expectExecutionResult(result: any): void {
  expect(result).toHaveProperty('success');
  expect(typeof result.success).toBe('boolean');
  
  if (result.success) {
    expect(result).toHaveProperty('outputs');
    expect(typeof result.outputs).toBe('object');
  } else {
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  }
}

export function expectValidationResult(result: any): void {
  expect(result).toHaveProperty('valid');
  expect(result).toHaveProperty('errors');
  expect(result).toHaveProperty('warnings');
  expect(result).toHaveProperty('fixes');
  
  expect(typeof result.valid).toBe('boolean');
  expect(Array.isArray(result.errors)).toBe(true);
  expect(Array.isArray(result.warnings)).toBe(true);
  expect(Array.isArray(result.fixes)).toBe(true);
}