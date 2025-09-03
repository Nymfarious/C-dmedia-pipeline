import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Image, Type, Plus, X } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore';

interface AITemplateEditorProps {
  onClose?: () => void;
}

export const AITemplateEditor: React.FC<AITemplateEditorProps> = ({ onClose }) => {
  const { activeTemplate, updateTemplateInput } = useTemplateStore();
  const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});
  const [aiProviders, setAiProviders] = useState<Record<string, string>>({});

  if (!activeTemplate) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No AI template selected</p>
        </CardContent>
      </Card>
    );
  }

  // Filter AI layers from template
  const aiLayers = activeTemplate.layers.filter(layer => 
    layer.type === 'ai-image' || layer.type === 'ai-text'
  );

  const handlePromptChange = (layerId: string, prompt: string) => {
    setAiPrompts(prev => ({ ...prev, [layerId]: prompt }));
    
    // Update the template layer content
    const updatedTemplate = {
      ...activeTemplate,
      layers: activeTemplate.layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, content: { ...layer.content, prompt } }
          : layer
      )
    };
    
    // Store update would happen here
  };

  const handleProviderChange = (layerId: string, provider: string) => {
    setAiProviders(prev => ({ ...prev, [layerId]: provider }));
  };

  const getProviderOptions = (layerType: string) => {
    if (layerType === 'ai-image') {
      return [
        { value: 'replicate.nano-banana', label: 'Nano-Banana (Smart Edit)' },
        { value: 'replicate.flux-schnell', label: 'FLUX Schnell (Fast)' },
        { value: 'replicate.flux-dev', label: 'FLUX Dev (Quality)' },
        { value: 'openai.dall-e', label: 'OpenAI DALL-E' },
        { value: 'gemini.nano', label: 'Gemini Nano' }
      ];
    } else {
      return [
        { value: 'openai.gpt-4o', label: 'GPT-4o (Text)' },
        { value: 'openai.gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gemini.text', label: 'Gemini Text' }
      ];
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Template Editor</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Configure AI-generated content for your template
        </p>
      </CardHeader>

      <CardContent className="space-y-6 overflow-y-auto">
        {/* Template Info */}
        <div className="space-y-2">
          <h3 className="font-medium">Template: {activeTemplate.name}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {aiLayers.length} AI Layer{aiLayers.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline">
              {activeTemplate.canvas.width} × {activeTemplate.canvas.height}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* AI Layers Configuration */}
        <div className="space-y-6">
          <h3 className="font-medium flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Content Layers</span>
          </h3>

          {aiLayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No AI layers in this template</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add AI layers to enable intelligent content generation
              </p>
            </div>
          ) : (
            aiLayers.map((layer) => (
              <Card key={layer.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {layer.type === 'ai-image' ? (
                        <Image className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Type className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {layer.type === 'ai-image' ? 'AI Image' : 'AI Text'}: {layer.id}
                      </span>
                    </div>
                    <Badge variant={layer.type === 'ai-image' ? 'default' : 'secondary'}>
                      {layer.type.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* AI Provider Selection */}
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select
                      value={aiProviders[layer.id] || (layer.content as any)?.aiOperation?.provider}
                      onValueChange={(value) => handleProviderChange(layer.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProviderOptions(layer.type).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prompt Configuration */}
                  <div className="space-y-2">
                    <Label>
                      {layer.type === 'ai-image' ? 'Image Generation Prompt' : 'Text Generation Prompt'}
                    </Label>
                    <Textarea
                      placeholder={
                        layer.type === 'ai-image' 
                          ? "Describe the image you want to generate. Use ${variable} for dynamic content..."
                          : "Describe the text you want to generate. Use ${variable} for dynamic content..."
                      }
                      value={aiPrompts[layer.id] || (layer.content as any)?.prompt || ''}
                      onChange={(e) => handlePromptChange(layer.id, e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use variables like <code>${`{name}`}</code> or <code>$input.title</code> for dynamic content
                    </p>
                  </div>

                  {/* Additional Settings for Image Layers */}
                  {layer.type === 'ai-image' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Negative Prompt (Optional)</Label>
                        <Input
                          placeholder="What to avoid in the generated image..."
                          defaultValue={(layer.content as any)?.negativePrompt || ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Fallback Image URL (Optional)</Label>
                        <Input
                          placeholder="URL to use if AI generation fails..."
                          defaultValue={(layer.content as any)?.fallbackSource || ''}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Settings for Text Layers */}
                  {layer.type === 'ai-text' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          defaultValue={(layer.content as any)?.maxLength || 100}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Fallback Text</Label>
                        <Input
                          placeholder="Text to use if AI generation fails..."
                          defaultValue={(layer.content as any)?.fallbackText || ''}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Template Variables */}
        {activeTemplate.inputs && Object.keys(activeTemplate.inputs).length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium">Available Variables</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(activeTemplate.inputs).map(([key, input]) => (
                  <Badge key={key} variant="outline" className="justify-start">
                    ${key} ({input.type})
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Use these variables in your AI prompts for dynamic content
              </p>
            </div>
          </>
        )}

        {/* Generate Preview */}
        <div className="pt-4">
          <Button className="w-full" disabled={aiLayers.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};