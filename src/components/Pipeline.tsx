import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiKeySettings } from '@/components/Settings/ApiKeySettings';
import { 
  Wand2, 
  Edit3, 
  Type, 
  Film, 
  Volume2, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Settings,
  RotateCcw
} from 'lucide-react';
import useAppStore from '@/store/appStore';
import { PipelineStep } from '@/types/media';
import { providers } from '@/adapters/registry';
import { cn } from '@/lib/utils';

const stepConfig = {
  GENERATE: {
    icon: Wand2,
    label: 'Generate Image',
    description: 'Create new images from text prompts',
    providers: Object.keys(providers.imageGen),
    fields: {
      prompt: { type: 'textarea', label: 'Prompt', required: true },
      negativePrompt: { type: 'textarea', label: 'Negative Prompt', required: false },
      seed: { type: 'number', label: 'Seed (optional)', required: false },
      aspect: { type: 'select', label: 'Aspect Ratio', options: ['1:1', '16:9', '9:16', '4:3'], required: false }
    }
  },
  EDIT: {
    icon: Edit3,
    label: 'Edit Image',
    description: 'Modify existing images with instructions',
    providers: Object.keys(providers.imageEdit),
    fields: {
      instruction: { type: 'textarea', label: 'Edit Instruction', required: true }
    }
  },
  ADD_TEXT: {
    icon: Type,
    label: 'Add Text',
    description: 'Overlay text on images',
    providers: Object.keys(providers.textOverlay),
    fields: {
      text: { type: 'textarea', label: 'Text Content', required: true },
      font: { type: 'select', label: 'Font', options: ['Inter', 'Arial', 'Helvetica', 'Georgia'], required: false },
      size: { type: 'number', label: 'Font Size', required: false },
      align: { type: 'select', label: 'Alignment', options: ['left', 'center', 'right'], required: false }
    }
  },
  ANIMATE: {
    icon: Film,
    label: 'Animate',
    description: 'Create animations from images',
    providers: Object.keys(providers.animate),
    fields: {
      frames: { type: 'number', label: 'Frame Count', required: false },
      fps: { type: 'number', label: 'Frames per Second', required: false },
      method: { type: 'select', label: 'Method', options: ['sprite', 'lottie'], required: false }
    }
  },
  ADD_SOUND: {
    icon: Volume2,
    label: 'Add Sound',
    description: 'Add audio to animations or images',
    providers: Object.keys(providers.sound),
    fields: {
      ttsText: { type: 'textarea', label: 'Text to Speech', required: false },
      sfxKind: { type: 'select', label: 'Sound Effect', options: ['ambient', 'dramatic', 'upbeat'], required: false },
      durationMs: { type: 'number', label: 'Duration (ms)', required: false }
    }
  }
} as const;

export function Pipeline() {
  const { 
    selectedAssetIds, 
    currentStepKind, 
    currentProviderKey, 
    params, 
    steps,
    setCurrentStepKind, 
    setCurrentProviderKey, 
    setParams, 
    enqueueStep, 
    runStep 
  } = useAppStore();
  
  const [isRunning, setIsRunning] = useState(false);

  const currentConfig = stepConfig[currentStepKind];
  const canRun = currentStepKind === 'GENERATE' || selectedAssetIds.length > 0;

  const handleRunStep = async () => {
    if (!canRun) return;
    
    setIsRunning(true);
    try {
      const stepId = enqueueStep(currentStepKind, selectedAssetIds, params, currentProviderKey);
      await runStep(stepId);
    } finally {
      setIsRunning(false);
    }
  };

  const handleParamChange = (field: string, value: any) => {
    setParams({ ...params, [field]: value });
  };

  const handleRetryStep = async (stepId: string) => {
    setIsRunning(true);
    try {
      await runStep(stepId);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatusIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4 text-status-queued" />;
      case 'running': return <Loader2 className="h-4 w-4 text-status-running animate-spin" />;
      case 'done': return <CheckCircle className="h-4 w-4 text-status-done" />;
      case 'failed': return <XCircle className="h-4 w-4 text-status-failed" />;
    }
  };

  const getStepStatusColor = (status: PipelineStep['status']) => {
    switch (status) {
      case 'queued': return 'bg-status-queued/20 text-status-queued border-status-queued/30';
      case 'running': return 'bg-status-running/20 text-status-running border-status-running/30';
      case 'done': return 'bg-status-done/20 text-status-done border-status-done/30';
      case 'failed': return 'bg-status-failed/20 text-status-failed border-status-failed/30';
    }
  };

  const renderField = (fieldName: string, fieldConfig: any) => {
    const value = params[fieldName] || '';
    
    switch (fieldConfig.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleParamChange(fieldName, e.target.value)}
            placeholder={fieldConfig.label}
            className="min-h-[80px]"
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleParamChange(fieldName, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldConfig.label}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            type={fieldConfig.type}
            value={value}
            onChange={(e) => handleParamChange(fieldName, e.target.value)}
            placeholder={fieldConfig.label}
          />
        );
    }
  };

  const stepsArray = Object.values(steps).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full bg-pipeline-bg border-l border-border flex flex-col">
      {/* Pipeline Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
          <ApiKeySettings 
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Step Selector */}
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(stepConfig).map(([stepKey, config]) => {
            const Icon = config.icon;
            const isSelected = currentStepKind === stepKey;
            
            return (
              <Button
                key={stepKey}
                variant={isSelected ? "default" : "pipeline"}
                className={cn(
                  "justify-start h-auto p-3",
                  isSelected && "shadow-pipeline"
                )}
                onClick={() => setCurrentStepKind(stepKey as PipelineStep['kind'])}
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs opacity-70">{config.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step Configuration */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Provider Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={currentProviderKey} onValueChange={setCurrentProviderKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentConfig.providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Input Assets Info */}
          {currentStepKind !== 'GENERATE' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Input Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAssetIds.length > 0 ? (
                  <Badge variant="outline" className="text-xs">
                    {selectedAssetIds.length} asset{selectedAssetIds.length > 1 ? 's' : ''} selected
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select assets from the gallery to use as input
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(currentConfig.fields).map(([fieldName, fieldConfig]) => (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName} className="text-xs">
                    {fieldConfig.label}
                    {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(fieldName, fieldConfig)}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Run Button */}
          <Button
            onClick={handleRunStep}
            disabled={!canRun || isRunning}
            className="w-full"
            variant="accent"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run {currentConfig.label}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step History */}
      <div className="border-t border-border">
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Recent Steps</h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {stepsArray.slice(0, 10).map((step) => (
                <Card key={step.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStepStatusIcon(step.status)}
                      <div>
                        <div className="text-xs font-medium">
                          {stepConfig[step.kind].label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(step.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs border", getStepStatusColor(step.status))}
                    >
                      {step.status}
                    </Badge>
                  </div>
                  
                  {step.error && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-destructive">
                        Error: {step.error}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryStep(step.id)}
                        disabled={isRunning}
                        className="h-6 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
              
              {stepsArray.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No steps yet. Run your first pipeline step above.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}