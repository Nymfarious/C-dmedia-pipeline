import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTemplateStore } from '@/store/templateStore';
import { useAppStore } from '@/store/appStore';
import { Asset } from '@/types/media';
import { Download, Upload, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TemplateCanvasProps {
  onExitTemplate?: () => void;
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({ onExitTemplate }) => {
  const { activeTemplate, templateInputs, templateAssets, updateTemplateInput, assignAssetToTemplate, generateTemplate } = useTemplateStore();
  const { assets, addAsset } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!activeTemplate) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No template selected</p>
      </Card>
    );
  }

  const handleAssetDrop = (inputId: string, asset: Asset) => {
    assignAssetToTemplate(inputId, asset);
    toast({
      title: "Asset assigned",
      description: `${asset.name} assigned to ${inputId}`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, inputId: string) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('asset-id');
    const asset = assets[assetId];
    if (asset) {
      handleAssetDrop(inputId, asset);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTemplate();
      if (result) {
        addAsset(result);
        toast({
          title: "Template generated successfully",
          description: `${result.name} has been added to your assets`,
        });
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const requiredInputs = Object.entries(activeTemplate.inputs).filter(([_, input]) => input.required);
  const optionalInputs = Object.entries(activeTemplate.inputs).filter(([_, input]) => !input.required);
  const canGenerate = requiredInputs.every(([id]) => {
    const input = activeTemplate.inputs[id];
    return input.type === 'asset' ? templateAssets[id] : templateInputs[id];
  });

  return (
    <div className="flex h-full">
      {/* Template Settings Panel */}
      <div className="w-80 border-r bg-background p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Template Info */}
          <div>
            <h3 className="text-lg font-semibold">{activeTemplate.name}</h3>
            <p className="text-sm text-muted-foreground">{activeTemplate.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{activeTemplate.category}</Badge>
              <Badge variant="outline">v{activeTemplate.version}</Badge>
            </div>
          </div>

          <Separator />

          {/* Required Inputs */}
          {requiredInputs.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-red-600">Required Fields</h4>
              <div className="space-y-4">
                {requiredInputs.map(([id, input]) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{input.description || id}</Label>
                    {input.type === 'text' && (
                      <Input
                        id={id}
                        value={templateInputs[id] || input.default || ''}
                        onChange={(e) => updateTemplateInput(id, e.target.value)}
                        placeholder={`Enter ${id}`}
                      />
                    )}
                    {input.type === 'color' && (
                      <Input
                        id={id}
                        type="color"
                        value={templateInputs[id] || input.default || '#000000'}
                        onChange={(e) => updateTemplateInput(id, e.target.value)}
                      />
                    )}
                    {input.type === 'asset' && (
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, id)}
                      >
                        {templateAssets[id] ? (
                          <div className="space-y-2">
                            <img
                              src={templateAssets[id].src}
                              alt={templateAssets[id].name}
                              className="w-16 h-16 object-cover rounded mx-auto"
                            />
                            <p className="text-sm">{templateAssets[id].name}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drop asset here or drag from gallery
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Inputs */}
          {optionalInputs.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Optional Fields</h4>
                <div className="space-y-4">
                  {optionalInputs.map(([id, input]) => (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={`opt-${id}`}>{input.description || id}</Label>
                      {input.type === 'text' && (
                        <Input
                          id={`opt-${id}`}
                          value={templateInputs[id] || input.default || ''}
                          onChange={(e) => updateTemplateInput(id, e.target.value)}
                          placeholder={`Enter ${id}`}
                        />
                      )}
                      {input.type === 'color' && (
                        <Input
                          id={`opt-${id}`}
                          type="color"
                          value={templateInputs[id] || input.default || '#000000'}
                          onChange={(e) => updateTemplateInput(id, e.target.value)}
                        />
                      )}
                      {input.type === 'asset' && (
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, id)}
                        >
                          {templateAssets[id] ? (
                            <div className="space-y-2">
                            <img
                              src={templateAssets[id].src}
                              alt={templateAssets[id].name}
                              className="w-16 h-16 object-cover rounded mx-auto"
                            />
                              <p className="text-sm">{templateAssets[id].name}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Drop asset here (optional)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Template"}
            </Button>
            
            {!canGenerate && (
              <p className="text-sm text-destructive">
                Please fill all required fields to generate
              </p>
            )}

            <Button variant="outline" onClick={() => setPreviewVisible(!previewVisible)} className="w-full">
              {previewVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewVisible ? "Hide Preview" : "Show Preview"}
            </Button>

            {onExitTemplate && (
              <Button variant="ghost" onClick={onExitTemplate} className="w-full">
                Exit Template Mode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview */}
      <div className="flex-1 bg-muted/30">
        {previewVisible ? (
          <div className="h-full flex items-center justify-center p-8">
            <Card className="p-8 bg-background">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Template Preview</h3>
                <div 
                  className="border rounded-lg bg-white shadow-lg mx-auto"
                  style={{
                    width: `${activeTemplate.canvas.width}px`,
                    height: `${activeTemplate.canvas.height}px`,
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    aspectRatio: `${activeTemplate.canvas.width} / ${activeTemplate.canvas.height}`
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={activeTemplate.canvas.width}
                    height={activeTemplate.canvas.height}
                    className="w-full h-full rounded-lg"
                    style={{ backgroundColor: activeTemplate.canvas.backgroundColor }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Live preview will be available once rendering engine is connected
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Preview hidden</p>
          </div>
        )}
      </div>
    </div>
  );
};