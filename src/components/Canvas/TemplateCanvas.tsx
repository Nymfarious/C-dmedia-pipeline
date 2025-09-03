import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTemplateStore } from '@/store/templateStore';
import { useAppStore } from '@/store/appStore';
import { Asset } from '@/types/media';
import { TemplateRenderer } from '@/compositor/templateRenderer';
import { Download, Upload, Eye, EyeOff, RefreshCw, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TemplateCanvasProps {
  onExitTemplate?: () => void;
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({ onExitTemplate }) => {
  const { activeTemplate, templateInputs, templateAssets, updateTemplateInput, assignAssetToTemplate, generateTemplate } = useTemplateStore();
  const { assets, addAsset } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TemplateRenderer | null>(null);

  // Initialize renderer when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new TemplateRenderer(canvasRef.current);
    }
  }, []);

  // Re-render template when inputs change
  useEffect(() => {
    if (activeTemplate && rendererRef.current && previewVisible) {
      renderPreview();
    }
  }, [activeTemplate, templateInputs, templateAssets, previewVisible]);

  const renderPreview = async () => {
    if (!activeTemplate || !rendererRef.current) return;
    
    setIsRendering(true);
    try {
      const placement = {
        variables: templateInputs,
        assets: templateAssets
      };
      
      await rendererRef.current.render(activeTemplate, placement);
    } catch (error) {
      console.error('Preview render failed:', error);
      toast({
        title: "Preview failed",
        description: "Unable to render template preview",
        variant: "destructive",
      });
    } finally {
      setIsRendering(false);
    }
  };

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
      <ScrollArea className="w-80 border-r bg-background">
        <div className="p-4 space-y-6">
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
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="text-destructive">*</span>
                Required Fields
              </h4>
              <div className="space-y-4">
                {requiredInputs.map(([id, input]) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id} className="text-sm font-medium">
                      {input.description || id.replace('_', ' ')}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    {renderInputField(id, input, true)}
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
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Optional Fields
                </h4>
                <div className="space-y-4">
                  {optionalInputs.map(([id, input]) => (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={`opt-${id}`} className="text-sm font-medium">
                        {input.description || id.replace('_', ' ')}
                      </Label>
                      {renderInputField(id, input, false)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Template"}
            </Button>
            
            {!canGenerate && (
              <p className="text-sm text-destructive text-center">
                Please fill all required fields to generate
              </p>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPreviewVisible(!previewVisible)} 
                className="flex-1"
                size="sm"
              >
                {previewVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {previewVisible ? "Hide" : "Show"} Preview
              </Button>

              <Button 
                variant="outline" 
                onClick={renderPreview} 
                disabled={isRendering}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {onExitTemplate && (
              <Button variant="ghost" onClick={onExitTemplate} className="w-full">
                Exit Template Mode
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Template Preview */}
      <div className="flex-1 bg-muted/30 flex flex-col">
        {previewVisible ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="p-6 bg-background shadow-lg">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h3 className="text-lg font-medium">Live Preview</h3>
                  {isRendering && (
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                
                <div 
                  className="border rounded-lg bg-white shadow-sm mx-auto relative overflow-hidden"
                  style={{
                    width: `${Math.min(activeTemplate.canvas.width, 600)}px`,
                    height: `${Math.min(activeTemplate.canvas.height, 400)}px`,
                    aspectRatio: `${activeTemplate.canvas.width} / ${activeTemplate.canvas.height}`
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={activeTemplate.canvas.width}
                    height={activeTemplate.canvas.height}
                    className="w-full h-full"
                    style={{ 
                      backgroundColor: activeTemplate.canvas.backgroundColor || '#ffffff',
                      imageRendering: 'auto'
                    }}
                  />
                  
                  {isRendering && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <div className="text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Rendering...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Canvas: {activeTemplate.canvas.width} × {activeTemplate.canvas.height}px</p>
                  <p>Updates automatically as you make changes</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Preview hidden</p>
              <p className="text-sm">Click "Show Preview" to see your template</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderInputField(id: string, input: any, isRequired: boolean) {
    const fieldId = isRequired ? id : `opt-${id}`;
    
    if (input.type === 'text') {
      return (
        <Input
          id={fieldId}
          value={templateInputs[id] || input.default || ''}
          onChange={(e) => updateTemplateInput(id, e.target.value)}
          placeholder={`Enter ${id.replace('_', ' ')}`}
          className={isRequired && !templateInputs[id] ? 'border-destructive' : ''}
        />
      );
    }
    
    if (input.type === 'color') {
      return (
        <div className="flex gap-2">
          <Input
            id={fieldId}
            type="color"
            value={templateInputs[id] || input.default || '#000000'}
            onChange={(e) => updateTemplateInput(id, e.target.value)}
            className="w-16 h-10 p-1 rounded cursor-pointer"
          />
          <Input
            value={templateInputs[id] || input.default || '#000000'}
            onChange={(e) => updateTemplateInput(id, e.target.value)}
            placeholder="Color value"
            className="flex-1"
          />
        </div>
      );
    }
    
    if (input.type === 'asset') {
      const hasAsset = !!templateAssets[id];
      
      return (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
            hasAsset 
              ? 'border-primary bg-primary/5' 
              : isRequired && !hasAsset
                ? 'border-destructive bg-destructive/5 hover:border-destructive/70'
                : 'border-border hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, id)}
        >
          {hasAsset ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={templateAssets[id].src}
                  alt={templateAssets[id].name}
                  className="w-20 h-20 object-cover rounded-lg mx-auto border shadow-sm"
                />
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-xs"
                >
                  ✓
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium truncate">{templateAssets[id].name}</p>
                <p className="text-xs text-muted-foreground">
                  {templateAssets[id].type} • Click to replace
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className={`w-8 h-8 mx-auto ${isRequired ? 'text-destructive' : 'text-muted-foreground'}`} />
              <div>
                <p className={`text-sm font-medium ${isRequired ? 'text-destructive' : 'text-foreground'}`}>
                  Drop {input.description || 'asset'} here
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag from gallery or click to browse
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  }
};