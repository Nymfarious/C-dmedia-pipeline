import { useState, useCallback } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { TemplateSpec } from '@/compositor/TemplateSpec';

export const useTemplateMode = () => {
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const { setActiveTemplate, resetTemplate } = useTemplateStore();

  const enterTemplateMode = useCallback((template?: TemplateSpec) => {
    setIsTemplateMode(true);
    if (template) {
      setActiveTemplate(template);
    }
  }, [setActiveTemplate]);

  const exitTemplateMode = useCallback(() => {
    setIsTemplateMode(false);
    resetTemplate();
  }, [resetTemplate]);

  const toggleTemplateMode = useCallback(() => {
    if (isTemplateMode) {
      exitTemplateMode();
    } else {
      enterTemplateMode();
    }
  }, [isTemplateMode, enterTemplateMode, exitTemplateMode]);

  return {
    isTemplateMode,
    enterTemplateMode,
    exitTemplateMode,
    toggleTemplateMode,
  };
};