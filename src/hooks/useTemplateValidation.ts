import { useMemo } from 'react';
import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'missing_asset';
}

export const useTemplateValidation = (
  template: TemplateSpec | null,
  placement: TemplatePlacement
) => {
  const validationResult = useMemo(() => {
    if (!template) {
      return { isValid: false, errors: [], warnings: [] };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check required inputs
    Object.entries(template.inputs || {}).forEach(([key, input]) => {
      if (input.required) {
        if (input.type === 'asset') {
          const asset = placement.assets[key];
          if (!asset) {
            errors.push({
              field: key,
              message: `${key} is required`,
              type: 'required'
            });
          }
        } else {
          const value = placement.variables[key];
          if (!value || value.toString().trim() === '') {
            errors.push({
              field: key,
              message: `${key} is required`,
              type: 'required'
            });
          }
        }
      }
    });

    // Check for color format validation
    Object.entries(placement.variables).forEach(([key, value]) => {
      const input = template.inputs?.[key];
      if (input?.type === 'color' && value) {
        const colorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorPattern.test(value.toString())) {
          warnings.push({
            field: key,
            message: `${key} should be a valid hex color (e.g., #FF0000)`,
            type: 'invalid'
          });
        }
      }
    });

    // Check asset compatibility
    Object.entries(placement.assets).forEach(([key, asset]) => {
      const input = template.inputs?.[key];
      if (input?.type === 'asset' && asset) {
        if (asset.type !== 'image') {
          warnings.push({
            field: key,
            message: `${key} should be an image asset`,
            type: 'invalid'
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [template, placement]);

  return validationResult;
};