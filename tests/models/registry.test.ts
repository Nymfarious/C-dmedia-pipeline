import { describe, it, expect } from 'vitest';
import { 
  MODELS, 
  getModel, 
  getModelsByMode, 
  getDefaultModel, 
  resolveModelString 
} from '@/models/registry';

describe('Model Registry', () => {
  it('should have valid model definitions', () => {
    expect(Object.keys(MODELS).length).toBeGreaterThan(0);
    
    Object.entries(MODELS).forEach(([key, spec]) => {
      expect(spec.provider).toBe('replicate');
      expect(spec.model).toContain('/');
      expect(Array.isArray(spec.modes)).toBe(true);
      expect(spec.modes.length).toBeGreaterThan(0);
    });
  });

  it('should get model by key', () => {
    const model = getModel('flux-pro');
    expect(model.provider).toBe('replicate');
    expect(model.model).toContain('flux');
  });

  it('should filter models by mode', () => {
    const txtModels = getModelsByMode('txt2img');
    expect(txtModels.length).toBeGreaterThan(0);
    
    txtModels.forEach(key => {
      const model = getModel(key);
      expect(model.modes).toContain('txt2img');
    });
  });

  it('should return default models for common modes', () => {
    expect(getDefaultModel('txt2img')).toBe('flux-pro');
    expect(getDefaultModel('image-edit')).toBe('nano-banana');
    expect(getDefaultModel('bg-remove')).toBe('bg-remover');
  });

  it('should resolve model strings correctly', () => {
    // Known model key
    expect(resolveModelString('flux-pro')).toContain('flux');
    
    // Already formatted model string
    const fullModel = 'black-forest-labs/flux-1.1-pro:abc123';
    expect(resolveModelString(fullModel)).toBe(fullModel);
    
    // Unknown model should fallback to flux-pro
    expect(resolveModelString('unknown-model')).toContain('flux');
  });

  it('should prevent regression to Gemini services', () => {
    // Search codebase would be better, but this ensures registry doesn't have direct Gemini
    Object.values(MODELS).forEach(spec => {
      expect(spec.provider).toBe('replicate');
      expect(spec.model).not.toMatch(/^gemini/);
      expect(spec.model).not.toMatch(/googleapis\.com/);
    });
  });
});