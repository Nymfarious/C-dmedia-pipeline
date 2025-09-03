import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/media';
import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';

interface AIGenerationProgress {
  stage: 'idle' | 'processing-ai' | 'compositing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  error?: string;
}

interface AIGenerationResult {
  asset: Asset;
  processingTime: number;
  aiLayersProcessed: number;
}

export const useAITemplateGeneration = () => {
  const [progress, setProgress] = useState<AIGenerationProgress>({
    stage: 'idle',
    progress: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateTemplate = useCallback(async (
    template: TemplateSpec, 
    placement: TemplatePlacement
  ): Promise<AIGenerationResult | null> => {
    try {
      setIsGenerating(true);
      setProgress({ stage: 'processing-ai', progress: 0, currentStep: 'Analyzing template' });

      // Check if template has AI layers
      const aiLayers = template.layers.filter(layer => 
        layer.type === 'ai-image' || layer.type === 'ai-text'
      );

      if (aiLayers.length === 0) {
        throw new Error('No AI layers found in template');
      }

      // Update progress
      setProgress({ 
        stage: 'processing-ai', 
        progress: 20, 
        currentStep: `Processing ${aiLayers.length} AI layer${aiLayers.length !== 1 ? 's' : ''}` 
      });

      const startTime = Date.now();

      // Call template composer
      const { data, error } = await supabase.functions.invoke('template-composer', {
        body: {
          template,
          placement,
          options: {
            format: template.canvas.format || 'png',
            quality: 95
          }
        }
      });

      if (error) {
        throw new Error(`AI template generation failed: ${error.message}`);
      }

      if (!data?.output) {
        throw new Error('No output received from AI template generation');
      }

      // Update progress
      setProgress({ 
        stage: 'compositing', 
        progress: 80, 
        currentStep: 'Compositing final image' 
      });

      // Simulate compositing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const processingTime = Date.now() - startTime;

      const asset: Asset = {
        id: `ai_template_${Date.now()}`,
        type: 'image',
        name: `${template.name} - AI Generated`,
        src: data.output,
        createdAt: Date.now(),
        category: 'generated',
        subcategory: 'ai-templates',
        tags: ['template', 'ai-generated', template.category || 'general'],
        meta: {
          width: data.metadata.width,
          height: data.metadata.height,
          templateName: template.name,
          aiLayersProcessed: data.metadata.aiLayersProcessed,
          processingTime: data.metadata.processingTime,
          aiGenerated: true,
          aiProviders: aiLayers.map(layer => (layer.content as any)?.aiOperation?.provider).filter(Boolean)
        }
      };

      setProgress({ stage: 'completed', progress: 100, currentStep: 'Generation complete' });

      toast({
        title: "AI Template Generated",
        description: `Successfully generated "${template.name}" with ${aiLayers.length} AI layer${aiLayers.length !== 1 ? 's' : ''}`,
      });

      return {
        asset,
        processingTime,
        aiLayersProcessed: aiLayers.length
      };

    } catch (error) {
      console.error('AI template generation error:', error);
      
      setProgress({ 
        stage: 'failed', 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate AI template',
        variant: "destructive"
      });

      return null;
    } finally {
      setIsGenerating(false);
      
      // Reset progress after a delay
      setTimeout(() => {
        setProgress({ stage: 'idle', progress: 0 });
      }, 2000);
    }
  }, [toast]);

  const resetProgress = useCallback(() => {
    setProgress({ stage: 'idle', progress: 0 });
    setIsGenerating(false);
  }, []);

  return {
    generateTemplate,
    progress,
    isGenerating,
    resetProgress
  };
};