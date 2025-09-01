import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EnhancedBrushTool } from './Canvas/EnhancedBrushTool';
import { ColorAdjustmentPanel } from './Canvas/ColorAdjustmentPanel';
import { PoseEditor } from './Canvas/PoseEditor';
import { InpaintingTool } from './Canvas/InpaintingTool';
import { AssetCombiner } from './Canvas/AssetCombiner';
import { 
  Wand2, 
  Palette, 
  Scissors, 
  ArrowUp, 
  User, 
  Sparkles,
  Edit3,
  Image,
  Layers
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';

interface EditPanelProps {
  selectedAsset: Asset | null;
  onEditComplete: (params: ImageEditParams) => Promise<void>;
  className?: string;
}

const EDIT_MODELS = [
  { key: 'replicate.nano-banana', name: 'Nano Banana', description: 'Natural language editing', category: 'General' },
  { key: 'replicate.professional-upscaler', name: 'Professional Upscaler', description: '4x quality enhancement', category: 'Enhancement' },
  { key: 'replicate.advanced-object-remover', name: 'Object Remover', description: 'Clean object removal', category: 'Cleanup' },
  { key: 'replicate.color-enhancement', name: 'Color Enhancer', description: 'Professional color grading', category: 'Color' },
  { key: 'replicate.pose-adjustment', name: 'Pose Adjuster', description: 'Human pose modification', category: 'Portrait' },
  { key: 'replicate.face-enhancement', name: 'Face Enhancer', description: 'Portrait enhancement', category: 'Portrait' },
  { key: 'replicate.style-transfer', name: 'Style Transfer', description: 'Artistic style application', category: 'Creative' },
  { key: 'replicate.rembg', name: 'Background Remover', description: 'Clean background removal', category: 'Cleanup' },
  { key: 'replicate.upscale', name: 'Basic Upscaler', description: '2x quality improvement', category: 'Enhancement' }
];

const STYLE_PRESETS = [
  'oil painting', 'watercolor', 'digital art', 'anime style', 'photorealistic', 
  'impressionist', 'abstract', 'minimalist', 'vintage', 'cyberpunk'
];

export function EditPanel({ selectedAsset, onEditComplete, className }: EditPanelProps) {
  const [selectedModel, setSelectedModel] = useState('replicate.nano-banana');
  const [instruction, setInstruction] = useState('');
  const [mask, setMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrushTool, setShowBrushTool] = useState(false);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  // Model-specific parameters
  const [upscaleScale, setUpscaleScale] = useState([4]);
  const [strength, setStrength] = useState([0.8]);
  const [steps, setSteps] = useState([20]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);

  if (!selectedAsset) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select an image to start editing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedModelInfo = EDIT_MODELS.find(m => m.key === selectedModel);
  const requiresMask = ['replicate.nano-banana', 'replicate.advanced-object-remover'].includes(selectedModel);
  const isColorEdit = selectedModel === 'replicate.color-enhancement';
  const isPoseEdit = selectedModel === 'replicate.pose-adjustment';

  const handleMaskExport = (maskData: { dataUrl: string; blob: Blob }) => {
    setMask(maskData);
    setShowBrushTool(false);
  };

  const handleEdit = async () => {
    if (!selectedAsset) return;
    
    if (requiresMask && !mask) {
      setShowBrushTool(true);
      return;
    }

    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: selectedModel.replace('replicate.', ''),
        instruction,
        provider: selectedModel,
        maskPngDataUrl: mask?.dataUrl,
        maskBlob: mask?.blob,
        // Model-specific parameters
        ...(selectedModel === 'replicate.professional-upscaler' && { scale: upscaleScale[0] }),
        ...(selectedModel.includes('nano-banana') && { 
          strength: strength[0],
          guidance_scale: guidanceScale[0],
          num_inference_steps: steps[0]
        })
      };
      
      await onEditComplete(params);
      setEditHistory(prev => [...prev, `${selectedModelInfo?.name}: ${instruction || 'Applied'}`]);
      setInstruction('');
      setMask(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColorAdjustment = async (adjustments: any) => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'color-enhancement',
        provider: 'replicate.color-enhancement',
        ...adjustments
      };
      
      await onEditComplete(params);
      setEditHistory(prev => [...prev, 'Color Enhancement Applied']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePoseAdjustment = async (keypoints: any[]) => {
    if (!selectedAsset) return;
    
    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'pose-adjustment',
        provider: 'replicate.pose-adjustment',
        poseKeypoints: keypoints,
        instruction: 'Adjust pose naturally'
      };
      
      await onEditComplete(params);
      setEditHistory(prev => [...prev, 'Pose Adjustment Applied']);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyStylePreset = (style: string) => {
    setInstruction(`Apply ${style} style to this image`);
    setSelectedModel('replicate.style-transfer');
  };

  if (showBrushTool) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Create Mask for {selectedModelInfo?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedBrushTool
            imageUrl={selectedAsset.src}
            onExportMask={handleMaskExport}
            onCancel={() => setShowBrushTool(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Image Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              <Sparkles className="h-4 w-4 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="inpaint">
              <Edit3 className="h-4 w-4 mr-1" />
              Inpaint
            </TabsTrigger>
            <TabsTrigger value="combine">
              <Layers className="h-4 w-4 mr-1" />
              Combine
            </TabsTrigger>
            <TabsTrigger value="color">
              <Palette className="h-4 w-4 mr-1" />
              Color
            </TabsTrigger>
            <TabsTrigger value="pose">
              <User className="h-4 w-4 mr-1" />
              Pose
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Edit Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_MODELS.map(model => (
                    <SelectItem key={model.key} value={model.key}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {model.category}
                        </Badge>
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instruction */}
            {!isColorEdit && !isPoseEdit && (
              <div className="space-y-2">
                <Label>Edit Instruction</Label>
                <Input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe what you want to change..."
                />
              </div>
            )}

            {/* Style Presets */}
            {selectedModel === 'replicate.style-transfer' && (
              <div className="space-y-2">
                <Label>Quick Style Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map(style => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      onClick={() => applyStylePreset(style)}
                      className="text-xs"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Model-specific controls */}
            {selectedModel === 'replicate.professional-upscaler' && (
              <div className="space-y-2">
                <Label>Upscale Factor: {upscaleScale[0]}x</Label>
                <Slider
                  value={upscaleScale}
                  onValueChange={setUpscaleScale}
                  min={2}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {selectedModel.includes('nano-banana') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Strength: {strength[0]}</Label>
                  <Slider
                    value={strength}
                    onValueChange={setStrength}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guidance Scale: {guidanceScale[0]}</Label>
                  <Slider
                    value={guidanceScale}
                    onValueChange={setGuidanceScale}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Steps: {steps[0]}</Label>
                  <Slider
                    value={steps}
                    onValueChange={setSteps}
                    min={10}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Mask status */}
            {requiresMask && (
              <div className="flex items-center gap-2">
                <Badge variant={mask ? "default" : "destructive"}>
                  {mask ? "Mask Created" : "Mask Required"}
                </Badge>
                {mask && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBrushTool(true)}
                  >
                    Edit Mask
                  </Button>
                )}
              </div>
            )}

            {/* Action Button */}
            <Button 
              onClick={handleEdit}
              disabled={isProcessing || (requiresMask && !mask) || (!isColorEdit && !isPoseEdit && !instruction)}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 
               requiresMask && !mask ? 'Create Mask First' :
               `Apply ${selectedModelInfo?.name}`}
            </Button>
          </TabsContent>

          <TabsContent value="inpaint">
            <InpaintingTool
              asset={selectedAsset}
              onComplete={onEditComplete}
            />
          </TabsContent>

          <TabsContent value="combine">
            <AssetCombiner
              onComplete={onEditComplete}
            />
          </TabsContent>

          <TabsContent value="color">
            <ColorAdjustmentPanel onAdjustment={handleColorAdjustment} />
          </TabsContent>

          <TabsContent value="pose">
            <PoseEditor 
              imageUrl={selectedAsset.src}
              onPoseAdjust={handlePoseAdjustment}
            />
          </TabsContent>
        </Tabs>
        
        {/* Edit History */}
        {editHistory.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Edit History</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {editHistory.slice(-5).map((edit, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded">
                    {edit}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}