import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { TemplateInput } from '@/compositor/TemplateSpec';

interface AIPromptInputProps {
  inputKey: string;
  input: TemplateInput;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const STYLE_OPTIONS = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic and natural' },
  { value: 'artistic', label: 'Artistic', description: 'Creative and expressive' },
  { value: 'corporate', label: 'Corporate', description: 'Professional and clean' },
  { value: 'creative', label: 'Creative', description: 'Bold and innovative' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and elegant' },
  { value: 'vibrant', label: 'Vibrant', description: 'Colorful and energetic' },
  { value: 'vintage', label: 'Vintage', description: 'Classic and timeless' },
  { value: 'abstract', label: 'Abstract', description: 'Non-representational art' }
];

export function AIPromptInput({ inputKey, input, value, onChange, error }: AIPromptInputProps) {
  const hasError = !!error;

  const renderPromptInput = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">
          {input.description || 'AI Prompt'}
          {input.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={input.placeholder || 'Describe what you want the AI to generate...'}
        className={`min-h-[80px] resize-none ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        rows={3}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Be specific about style, colors, and mood for best results
      </p>
    </div>
  );

  const renderStyleInput = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {input.description || 'Style'}
        {input.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className={hasError ? 'border-destructive focus:ring-destructive' : ''}>
          <SelectValue placeholder="Choose a style..." />
        </SelectTrigger>
        <SelectContent>
          {(input.options || STYLE_OPTIONS.map(s => s.value)).map((option) => {
            const styleInfo = STYLE_OPTIONS.find(s => s.value === option) || { value: option, label: option, description: '' };
            return (
              <SelectItem key={option} value={option}>
                <div className="flex flex-col">
                  <span className="font-medium">{styleInfo.label}</span>
                  {styleInfo.description && (
                    <span className="text-xs text-muted-foreground">{styleInfo.description}</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  const renderNegativeInput = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {input.description || 'Negative Prompt'}
        {input.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={input.placeholder || 'What to avoid (e.g., blurry, low quality, text)'}
        className={hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Specify elements you don't want in the generated image
      </p>
    </div>
  );

  const renderParamsInput = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {input.description || 'Generation Parameters'}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Seed</Label>
          <Input
            type="number"
            value={value?.seed || ''}
            onChange={(e) => onChange({ ...value, seed: parseInt(e.target.value) || undefined })}
            placeholder="Random"
            className="text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Steps</Label>
          <Input
            type="number"
            value={value?.steps || ''}
            onChange={(e) => onChange({ ...value, steps: parseInt(e.target.value) || undefined })}
            placeholder="Auto"
            className="text-xs"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Advanced settings for fine-tuning generation
      </p>
    </div>
  );

  switch (input.type) {
    case 'ai-prompt':
      return renderPromptInput();
    case 'ai-style':
      return renderStyleInput();
    case 'ai-negative':
      return renderNegativeInput();
    case 'ai-params':
      return renderParamsInput();
    default:
      return null;
  }
}