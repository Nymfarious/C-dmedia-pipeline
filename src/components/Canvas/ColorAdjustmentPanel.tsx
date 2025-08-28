import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sun, Palette, Contrast, Zap } from 'lucide-react';

interface ColorAdjustmentPanelProps {
  onAdjustment: (adjustments: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    warmth?: number;
  }) => void;
  className?: string;
}

export function ColorAdjustmentPanel({ onAdjustment, className }: ColorAdjustmentPanelProps) {
  const [brightness, setBrightness] = React.useState([0]);
  const [contrast, setContrast] = React.useState([0]);
  const [saturation, setSaturation] = React.useState([0]);
  const [warmth, setWarmth] = React.useState([0]);

  const handleApplyAdjustments = () => {
    onAdjustment({
      brightness: brightness[0],
      contrast: contrast[0],
      saturation: saturation[0],
      warmth: warmth[0]
    });
  };

  const resetAdjustments = () => {
    setBrightness([0]);
    setContrast([0]);
    setSaturation([0]);
    setWarmth([0]);
  };

  const quickPresets = [
    { name: 'Brighten', icon: Sun, adjustments: { brightness: 20 } },
    { name: 'Warm Up', icon: Zap, adjustments: { warmth: 15, brightness: 10 } },
    { name: 'Vivid', icon: Palette, adjustments: { saturation: 25, contrast: 15 } },
    { name: 'High Contrast', icon: Contrast, adjustments: { contrast: 30 } }
  ];

  const applyPreset = (adjustments: any) => {
    if (adjustments.brightness !== undefined) setBrightness([adjustments.brightness]);
    if (adjustments.contrast !== undefined) setContrast([adjustments.contrast]);
    if (adjustments.saturation !== undefined) setSaturation([adjustments.saturation]);
    if (adjustments.warmth !== undefined) setWarmth([adjustments.warmth]);
    
    onAdjustment(adjustments);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Color Adjustments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Quick Presets</div>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.adjustments)}
                className="h-8"
              >
                <preset.icon className="h-3 w-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Adjustments */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs">Brightness</span>
              <Badge variant="outline" className="text-xs">{brightness[0]}%</Badge>
            </div>
            <Slider
              value={brightness}
              onValueChange={setBrightness}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs">Contrast</span>
              <Badge variant="outline" className="text-xs">{contrast[0]}%</Badge>
            </div>
            <Slider
              value={contrast}
              onValueChange={setContrast}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs">Saturation</span>
              <Badge variant="outline" className="text-xs">{saturation[0]}%</Badge>
            </div>
            <Slider
              value={saturation}
              onValueChange={setSaturation}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs">Warmth</span>
              <Badge variant="outline" className="text-xs">{warmth[0]}%</Badge>
            </div>
            <Slider
              value={warmth}
              onValueChange={setWarmth}
              min={-50}
              max={50}
              step={1}
            />
          </div>
        </div>

        {/* Apply/Reset Buttons */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleApplyAdjustments} className="flex-1">
            Apply Changes
          </Button>
          <Button variant="outline" size="sm" onClick={resetAdjustments}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}