import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  Target, 
  Palette, 
  Brush, 
  Sparkles, 
  Eye,
  Settings,
  Zap,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface GeminiNanoInterfaceProps {
  imageUrl: string;
  maskUrl?: string;
  onEdit: (params: {
    mode: string;
    prompt: string;
    parameters: Record<string, any>;
  }) => Promise<void>;
  className?: string;
}

interface OperationMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  examples: string[];
}

const OPERATION_MODES: OperationMode[] = [
  {
    id: 'precision-replace',
    name: 'Precision Replace',
    description: 'Exact object swapping with perfect context matching',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-blue-500',
    examples: ['change dog to cat', 'replace car with bicycle', 'turn apple into orange']
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    description: 'Apply artistic styles while preserving content',
    icon: <Palette className="h-4 w-4" />,
    color: 'bg-purple-500',
    examples: ['make it oil painting style', 'convert to watercolor', 'apply anime style']
  },
  {
    id: 'smart-inpaint',
    name: 'Smart Inpaint',
    description: 'Intelligent filling with context awareness',
    icon: <Brush className="h-4 w-4" />,
    color: 'bg-green-500',
    examples: ['remove person seamlessly', 'add tree in background', 'extend the sky']
  },
  {
    id: 'detail-enhance',
    name: 'Detail Enhance',
    description: 'Refine and improve specific areas',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-amber-500',
    examples: ['sharpen the face', 'enhance texture details', 'improve lighting']
  }
];

export function GeminiNanoInterface({ 
  imageUrl, 
  maskUrl, 
  onEdit, 
  className = '' 
}: GeminiNanoInterfaceProps) {
  const [selectedMode, setSelectedMode] = useState<string>('precision-replace');
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [targetQuality, setTargetQuality] = useState<string>('high');
  const [complexity, setComplexity] = useState<string>('moderate');
  const [preserveContext, setPreserveContext] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced parameters
  const [guidanceScale, setGuidanceScale] = useState([10.0]);
  const [strength, setStrength] = useState([0.85]);
  const [steps, setSteps] = useState([35]);

  const selectedModeInfo = OPERATION_MODES.find(mode => mode.id === selectedMode);

  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
    
    // Generate enhanced prompt preview
    const mode = OPERATION_MODES.find(m => m.id === selectedMode);
    if (mode && value.trim()) {
      const preview = generatePromptPreview(value, selectedMode, targetQuality);
      setEnhancedPrompt(preview);
    } else {
      setEnhancedPrompt('');
    }
  }, [selectedMode, targetQuality]);

  const generatePromptPreview = (userPrompt: string, mode: string, quality: string): string => {
    const qualityModifiers = quality === 'ultra' 
      ? 'ultra-high detail, professional quality, photorealistic rendering'
      : quality === 'high'
      ? 'high detail, sharp focus, natural rendering'
      : 'good quality, clear details';

    switch (mode) {
      case 'precision-replace':
        return `Precisely execute: ${userPrompt}. Exact positioning, seamless integration, ${qualityModifiers}`;
      case 'style-transfer':
        return `Transform to ${userPrompt} while preserving all content. Consistent style application, ${qualityModifiers}`;
      case 'smart-inpaint':
        return `Intelligently: ${userPrompt}. Context-aware filling, natural blending, ${qualityModifiers}`;
      case 'detail-enhance':
        return `Enhance: ${userPrompt}. Improved clarity, refined textures, ${qualityModifiers}`;
      default:
        return `${userPrompt}. ${qualityModifiers}`;
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    try {
      await onEdit({
        mode: selectedMode,
        prompt: prompt.trim(),
        parameters: {
          targetQuality,
          complexity,
          preserveContext,
          guidance_scale: guidanceScale[0],
          strength: strength[0],
          num_inference_steps: steps[0]
        }
      });
      
      toast.success(`${selectedModeInfo?.name} applied successfully!`);
    } catch (error) {
      console.error('Edit failed:', error);
      toast.error('Edit failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToDefaults = () => {
    const mode = OPERATION_MODES.find(m => m.id === selectedMode);
    if (mode) {
      // Reset parameters based on mode
      switch (selectedMode) {
        case 'precision-replace':
          setGuidanceScale([11.5]);
          setStrength([0.92]);
          setSteps([45]);
          break;
        case 'style-transfer':
          setGuidanceScale([9.5]);
          setStrength([0.78]);
          setSteps([38]);
          break;
        case 'smart-inpaint':
          setGuidanceScale([10.5]);
          setStrength([0.88]);
          setSteps([40]);
          break;
        case 'detail-enhance':
          setGuidanceScale([8.5]);
          setStrength([0.68]);
          setSteps([32]);
          break;
        default:
          setGuidanceScale([10.0]);
          setStrength([0.85]);
          setSteps([35]);
      }
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Gemini Nano Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Operation Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Operation Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            {OPERATION_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  resetToDefaults();
                }}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedMode === mode.id
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded ${mode.color} text-white`}>
                    {mode.icon}
                  </div>
                  <span className="font-medium text-sm">{mode.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Mode Info */}
        {selectedModeInfo && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded ${selectedModeInfo.color} text-white`}>
                  {selectedModeInfo.icon}
                </div>
                <span className="font-medium">{selectedModeInfo.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{selectedModeInfo.description}</p>
              <div className="space-y-1">
                <span className="text-xs font-medium">Examples:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedModeInfo.examples.map((example, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handlePromptChange(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Enhancement Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={`Enter your ${selectedModeInfo?.name.toLowerCase()} instruction...`}
            className="w-full"
          />
        </div>

        {/* Enhanced Prompt Preview */}
        {enhancedPrompt && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Enhanced Prompt Preview
            </Label>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">{enhancedPrompt}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quality & Settings */}
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Settings
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Quality</Label>
                <Select value={targetQuality} onValueChange={setTargetQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High Quality</SelectItem>
                    <SelectItem value="ultra">Ultra Quality</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                    <SelectItem value="ultra-complex">Ultra Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Guidance Scale: {guidanceScale[0]}</Label>
                <Slider
                  value={guidanceScale}
                  onValueChange={setGuidanceScale}
                  min={1.0}
                  max={20.0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Strength: {strength[0]}</Label>
                <Slider
                  value={strength}
                  onValueChange={setStrength}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Inference Steps: {steps[0]}</Label>
                <Slider
                  value={steps}
                  onValueChange={setSteps}
                  min={10}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Optimal
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Action Button */}
        <Button 
          onClick={handleEdit}
          disabled={!prompt.trim() || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing with {selectedModeInfo?.name}...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Apply {selectedModeInfo?.name}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}