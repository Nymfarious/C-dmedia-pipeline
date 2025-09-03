import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTemplateStore } from '@/store/templateStore';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';
import { FileImage, Upload, X, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateEditorProps {
  onClose?: () => void;
}

export function TemplateEditor({ onClose }: TemplateEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    activeTemplate, 
    templateInputs, 
    templateAssets,
    updateTemplateInput,
    assignAssetToTemplate,
    generateTemplate
  } = useTemplateStore();
  const { assets, addAsset } = useAppStore();

  if (!activeTemplate) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileImage className="h-12 w-12 mx-auto mb-2" />
          <p>No template selected</p>
        </div>
      </div>
    );
  }

  const handleAssetDrop = (inputKey: string, assetId: string) => {
    const asset = assets[assetId];
    if (asset) {
      assignAssetToTemplate(inputKey, asset);
      toast.success(`Asset assigned to ${inputKey.replace('_', ' ')}`);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTemplate();
      if (result) {
        addAsset(result);
        toast.success('Template generated successfully!');
        onClose?.();
      } else {
        toast.error('Failed to generate template');
      }
    } catch (error) {
      toast.error('Error generating template');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInputField = (key: string, input: any) => {
    const value = templateInputs[key] || input.default || '';
    
    switch (input.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateTemplateInput(key, e.target.value)}
            placeholder={input.description}
          />
        );
      
      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <div 
              className="w-8 h-8 rounded border-2 border-border cursor-pointer"
              style={{ backgroundColor: value }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = value;
                input.onchange = (e) => updateTemplateInput(key, (e.target as HTMLInputElement).value);
                input.click();
              }}
            />
            <Input
              value={value}
              onChange={(e) => updateTemplateInput(key, e.target.value)}
              placeholder={input.description}
              className="flex-1"
            />
          </div>
        );
      
      case 'asset':
        const assignedAsset = templateAssets[key];
        return (
          <div className="space-y-2">
            {assignedAsset ? (
              <div className="flex items-center gap-2 p-2 border rounded">
                <img 
                  src={assignedAsset.src} 
                  alt={assignedAsset.name}
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm flex-1 truncate">{assignedAsset.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => assignAssetToTemplate(key, null as any)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onDrop={(e) => {
                  e.preventDefault();
                  const assetId = e.dataTransfer.getData('text/plain');
                  handleAssetDrop(key, assetId);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drop an asset here or select from library
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateTemplateInput(key, e.target.value)}
            placeholder={input.description}
          />
        );
    }
  };

  const requiredInputs = activeTemplate.inputs ? Object.keys(activeTemplate.inputs).filter(
    key => activeTemplate.inputs![key].required
  ) : [];
  const optionalInputs = activeTemplate.inputs ? Object.keys(activeTemplate.inputs).filter(
    key => !activeTemplate.inputs![key].required
  ) : [];

  const canGenerate = requiredInputs.every(key => {
    const input = activeTemplate.inputs?.[key];
    if (input?.type === 'asset') {
      return templateAssets[key];
    }
    return templateInputs[key] && templateInputs[key].trim() !== '';
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{activeTemplate.name}</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{activeTemplate.description}</p>
        
        <div className="flex gap-2 mt-3">
          {activeTemplate.category && (
            <Badge variant="outline" className="capitalize">
              {activeTemplate.category}
            </Badge>
          )}
          <Badge variant="secondary">
            v{activeTemplate.version}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Required Inputs */}
          {requiredInputs.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Required Inputs
              </h4>
              <div className="space-y-4">
                {requiredInputs.map(key => {
                  const input = activeTemplate.inputs?.[key];
                  return (
                    <div key={key}>
                      <Label htmlFor={key} className="text-sm font-medium capitalize">
                        {key.replace('_', ' ')}
                      </Label>
                      <div className="mt-1">
                        {renderInputField(key, input)}
                      </div>
                      {input.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {input.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Inputs */}
          {optionalInputs.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Optional Inputs
              </h4>
              <div className="space-y-4">
                {optionalInputs.map(key => {
                  const input = activeTemplate.inputs?.[key];
                  return (
                    <div key={key}>
                      <Label htmlFor={key} className="text-sm font-medium capitalize">
                        {key.replace('_', ' ')}
                      </Label>
                      <div className="mt-1">
                        {renderInputField(key, input)}
                      </div>
                      {input.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {input.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button 
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Generate Template
            </div>
          )}
        </Button>
        
        {!canGenerate && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Please fill all required inputs to generate
          </p>
        )}
      </div>
    </div>
  );
}