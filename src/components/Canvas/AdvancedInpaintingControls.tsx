import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Zap, Target, Sparkles, RotateCcw } from 'lucide-react';

interface AdvancedInpaintingControlsProps {
  qualityVsSpeed: number[];
  onQualityVsSpeedChange: (value: number[]) => void;
  precisionVsCreativity: number[];
  onPrecisionVsCreativityChange: (value: number[]) => void;
  enableCleanupPass: boolean;
  onEnableCleanupPassChange: (enabled: boolean) => void;
  maskPadding: number[];
  onMaskPaddingChange: (value: number[]) => void;
  maskFeathering: number[];
  onMaskFeatheringChange: (value: number[]) => void;
  onResetToDefaults: () => void;
  className?: string;
}

export function AdvancedInpaintingControls({
  qualityVsSpeed,
  onQualityVsSpeedChange,
  precisionVsCreativity,
  onPrecisionVsCreativityChange,
  enableCleanupPass,
  onEnableCleanupPassChange,
  maskPadding,
  onMaskPaddingChange,
  maskFeathering,
  onMaskFeatheringChange,
  onResetToDefaults,
  className
}: AdvancedInpaintingControlsProps) {
  
  const getQualityLabel = (value: number) => {
    if (value <= 25) return 'Fast';
    if (value <= 50) return 'Balanced';
    if (value <= 75) return 'High Quality';
    return 'Ultra Quality';
  };
  
  const getPrecisionLabel = (value: number) => {
    if (value <= 25) return 'Creative';
    if (value <= 50) return 'Balanced';
    if (value <= 75) return 'Precise';
    return 'Ultra Precise';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Controls
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetToDefaults}
            className="h-8 px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quality vs Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quality vs Speed
            </Label>
            <Badge variant="outline" className="text-xs">
              {getQualityLabel(qualityVsSpeed[0])}
            </Badge>
          </div>
          <Slider
            value={qualityVsSpeed}
            onValueChange={onQualityVsSpeedChange}
            min={0}
            max={100}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fast</span>
            <span>Balanced</span>
            <span>Quality</span>
            <span>Ultra</span>
          </div>
        </div>

        {/* Precision vs Creativity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Precision vs Creativity
            </Label>
            <Badge variant="outline" className="text-xs">
              {getPrecisionLabel(precisionVsCreativity[0])}
            </Badge>
          </div>
          <Slider
            value={precisionVsCreativity}
            onValueChange={onPrecisionVsCreativityChange}
            min={0}
            max={100}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Creative</span>
            <span>Balanced</span>
            <span>Precise</span>
            <span>Ultra</span>
          </div>
        </div>

        {/* Mask Enhancement */}
        <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium">Mask Enhancement</Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Padding: {maskPadding[0]}px</Label>
              <Slider
                value={maskPadding}
                onValueChange={onMaskPaddingChange}
                min={0}
                max={20}
                step={2}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Adds context around mask edges
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Feathering: {maskFeathering[0]}px</Label>
              <Slider
                value={maskFeathering}
                onValueChange={onMaskFeatheringChange}
                min={0}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Softens mask edges for smoother blending
              </div>
            </div>
          </div>
        </div>

        {/* Cleanup Pass */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Auto Cleanup Pass
            </Label>
            <div className="text-xs text-muted-foreground">
              Automatically refine artifacts after main operation
            </div>
          </div>
          <Switch
            checked={enableCleanupPass}
            onCheckedChange={onEnableCleanupPassChange}
          />
        </div>

      </CardContent>
    </Card>
  );
}