import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Palette, Upload, Eye, EyeOff, RefreshCw, Wand2, Download } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore';
import { useAITemplateGeneration } from '@/hooks/useAITemplateGeneration';
import { TemplateRenderer } from '@/compositor/templateRenderer';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TemplateAssetUpload } from '@/components/TemplateAssetUpload';
import { TemplatePreviewControls } from '@/components/TemplatePreviewControls';
import { useTemplateValidation } from '@/hooks/useTemplateValidation';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TemplateCanvasProps {
  onExitTemplate?: () => void;
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({ onExitTemplate }) => {
  const { 
    activeTemplate, 
    templateInputs, 
    templateAssets, 
    updateTemplateInput, 
    assignAssetToTemplate, 
    generateTemplate 
  } = useTemplateStore();
  const { addAsset } = useAppStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ stage: string; progress: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TemplateRenderer | null>(null);
  
  // Use validation hook
  const validation = useTemplateValidation(activeTemplate, {
    variables: templateInputs,
    assets: templateAssets
  });

  // Initialize renderer when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new TemplateRenderer(canvasRef.current);
    }
  }, []);

  // Re-render preview when inputs change (live preview)
  useEffect(() => {
    if (activeTemplate && rendererRef.current && showPreview) {
      const timeoutId = setTimeout(() => {
        renderPreview();
      }, 100); // Small debounce for performance
      
      return () => clearTimeout(timeoutId);
    }
  }, [templateInputs, templateAssets, activeTemplate, showPreview]);

  const renderPreview = useCallback(async () => {
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
      toast.error('Failed to render preview');
    } finally {
      setIsRendering(false);
    }
  }, [activeTemplate, templateInputs, templateAssets]);

  const handleAssetChange = useCallback((inputKey: string, asset: Asset | null) => {
    if (asset) {
      assignAssetToTemplate(inputKey, asset);
      toast.success(`Assigned ${asset.name} to ${inputKey}`);
    } else {
      // Remove asset
      const newAssets = { ...templateAssets };
      delete newAssets[inputKey];
      Object.keys(newAssets).forEach(key => {
        assignAssetToTemplate(key, newAssets[key]);
      });
      toast.success(`Removed asset from ${inputKey}`);
    }
  }, [assignAssetToTemplate, templateAssets]);

  const handleGenerate = async () => {
    if (!validation.isValid) {
      toast.error('Please fix validation errors before generating');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Attempting template generation...');
      const result = await generateTemplate();
      if (result) {
        console.log('Template generated successfully:', result);
        addAsset(result);
        toast.success(`Generated ${result.name} successfully`);
        onExitTemplate?.();
      } else {
        console.warn('Template generation returned null');
        toast.error('Template generation failed - no result returned');
      }
    } catch (error) {
      console.error('Template generation failed:', error);
      toast.error(`Failed to generate template: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!activeTemplate) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No template selected</p>
      </Card>
    );
  }

  const renderInputField = (key: string, input: any) => {
    const value = templateInputs[key] || input.default || '';
    const isRequired = input.required;
    const fieldError = validation.errors.find(error => error.field === key);
    const hasError = !!fieldError;
    
    switch (input.type) {
      case 'text':
        return (
          <Input
            key={key}
            value={value}
            onChange={(e) => updateTemplateInput(key, e.target.value)}
            placeholder={input.description || `Enter ${key}`}
            className={cn("w-full", hasError && "border-destructive focus-visible:ring-destructive")}
          />
        );
      
      case 'color':
        return (
          <div key={key} className="flex gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => updateTemplateInput(key, e.target.value)}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => updateTemplateInput(key, e.target.value)}
              placeholder="#000000"
              className={cn("flex-1", hasError && "border-destructive focus-visible:ring-destructive")}
            />
          </div>
        );
      
      case 'asset':
        return (
          <TemplateAssetUpload
            key={key}
            value={templateAssets[key]}
            onChange={(asset) => handleAssetChange(key, asset)}
            placeholder={input.description || `Upload or select ${key}`}
            className={hasError ? "border-destructive" : ""}
          />
        );
      
      default:
        return (
          <Input
            key={key}
            value={value}
            onChange={(e) => updateTemplateInput(key, e.target.value)}
            placeholder={input.description || `Enter ${key}`}
            className={cn("w-full", hasError && "border-destructive focus-visible:ring-destructive")}
          />
        );
    }
  };

  const requiredInputs = Object.entries(activeTemplate.inputs || {}).filter(([_, input]) => input.required);
  const optionalInputs = Object.entries(activeTemplate.inputs || {}).filter(([_, input]) => !input.required);
  const canGenerate = validation.isValid;

  return (
    <div className="flex h-full">
      {/* Settings Panel */}
      <div className="w-80 border-r bg-background p-4 space-y-6 overflow-y-auto">
        {/* Template Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{activeTemplate.name}</h3>
            {onExitTemplate && (
              <Button variant="ghost" size="sm" onClick={onExitTemplate}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{activeTemplate.description}</p>
          <div className="flex gap-2">
            <Badge variant="secondary">{activeTemplate.category}</Badge>
            <Badge variant="outline">v{activeTemplate.version}</Badge>
          </div>
        </div>

        <Separator />

        {/* Required Inputs */}
        {requiredInputs.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">
              Required Fields
            </h4>
            <div className="space-y-4">
              {requiredInputs.map(([key, input]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {input.description || key.replace('_', ' ')}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  {renderInputField(key, input)}
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
              <h4 className="font-medium mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Optional Fields
              </h4>
              <div className="space-y-4">
                {optionalInputs.map(([key, input]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {input.description || key.replace('_', ' ')}
                    </Label>
                    {renderInputField(key, input)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <TemplatePreviewControls
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
            onRefresh={renderPreview}
            isRendering={isRendering}
            templateName={activeTemplate.name}
            canvasSize={activeTemplate.canvas}
          />
          
          {validation.errors.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-3">
                <p className="text-sm font-medium text-destructive mb-2">Issues Found:</p>
                <ul className="text-sm text-destructive space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-destructive rounded-full" />
                      {error.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {validation.warnings.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-3">
                <p className="text-sm font-medium text-yellow-600 mb-2">Warnings:</p>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          <Button 
            onClick={handleGenerate} 
            disabled={!canGenerate || isGenerating}
            className="w-full"
            variant={canGenerate ? "default" : "secondary"}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Template'}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {showPreview ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
            <Card className="bg-background shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={activeTemplate.canvas.width}
                    height={activeTemplate.canvas.height}
                    className="rounded-lg shadow-sm border"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      width: 'auto',
                      height: 'auto',
                      backgroundColor: activeTemplate.canvas.backgroundColor || '#ffffff'
                    }}
                  />
                  
                  {isRendering && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Rendering...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
                  <p>Canvas: {activeTemplate.canvas.width} × {activeTemplate.canvas.height}px</p>
                  <p>Updates live as you make changes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Preview Hidden</p>
              <p className="text-sm">Click "Show Preview" to see your template</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};