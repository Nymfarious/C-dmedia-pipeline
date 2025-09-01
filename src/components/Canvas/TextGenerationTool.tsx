import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TypeIcon, Sparkles, RefreshCw } from 'lucide-react';
import { Asset } from '@/types/media';
import { fluxTextAdapter } from '@/adapters/text-gen/fluxTextAdapter';
import { toast } from 'sonner';

interface TextGenerationToolProps {
  asset: Asset;
  onComplete: (asset: Asset) => void;
  onCancel?: () => void;
  className?: string;
}

export function TextGenerationTool({ asset, onComplete, onCancel, className }: TextGenerationToolProps) {
  const [textPrompt, setTextPrompt] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [textColor, setTextColor] = useState('auto');
  const [textEffect, setTextEffect] = useState('none');
  const [position, setPosition] = useState('center');
  const [isGenerating, setIsGenerating] = useState(false);

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  const colorOptions = [
    { value: 'auto', label: 'Auto (AI Choice)' },
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'gold', label: 'Gold' },
    { value: 'gradient', label: 'Gradient' }
  ];

  const effectOptions = [
    { value: 'none', label: 'None' },
    { value: 'shadow', label: 'Drop Shadow' },
    { value: 'outline', label: 'Outline' },
    { value: 'glow', label: 'Glow Effect' },
    { value: '3d', label: '3D Effect' }
  ];

  const positionOptions = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) {
      toast.error('Please enter text to add');
      return;
    }

    setIsGenerating(true);
    try {
      const params = {
        text: textPrompt,
        fontSize: fontSize,
        color: textColor,
        effect: textEffect,
        position: position
      };

      console.log('TextGenerationTool - Generating with params:', params);
      
      const newAsset = await fluxTextAdapter.addText(asset, params);
      
      toast.success('Text added successfully!');
      onComplete(newAsset);
    } catch (error) {
      console.error('Text generation error:', error);
      toast.error('Failed to add text to image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          Add Text with AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <Label>Text to Add</Label>
          <Input
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Enter the text you want to add..."
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            Examples: "SALE 50% OFF", "Welcome Home", "Happy Birthday"
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label>Font Size</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[fontSizeOptions.findIndex(opt => opt.value === fontSize)]}
              onValueChange={(value) => {
                setFontSize(fontSizeOptions[value[0]].value);
              }}
              max={fontSizeOptions.length - 1}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[80px] text-center">
              {fontSizeOptions.find(opt => opt.value === fontSize)?.label}
            </Badge>
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label>Text Color</Label>
          <Select value={textColor} onValueChange={setTextColor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Effect */}
        <div className="space-y-2">
          <Label>Text Effect</Label>
          <Select value={textEffect} onValueChange={setTextEffect}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {effectOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div className="space-y-3">
          <Label>Text Position</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[positionOptions.findIndex(opt => opt.value === position)]}
              onValueChange={(value) => {
                setPosition(positionOptions[value[0]].value);
              }}
              max={positionOptions.length - 1}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="min-w-[100px] text-center">
              {positionOptions.find(opt => opt.value === position)?.label}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleGenerateText}
            disabled={!textPrompt.trim() || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Add Text
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}