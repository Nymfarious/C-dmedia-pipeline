import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CropSettings {
  aspectRatio: string;
  preset: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropToolProps {
  imageUrl?: string;
  onCropApply: (cropSettings: CropSettings) => void;
  className?: string;
}

const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)', width: 1, height: 1 },
  { value: '4:3', label: 'Traditional (4:3)', width: 4, height: 3 },
  { value: '16:9', label: 'Widescreen (16:9)', width: 16, height: 9 },
  { value: '9:16', label: 'Portrait (9:16)', width: 9, height: 16 },
  { value: '3:4', label: 'Portrait (3:4)', width: 3, height: 4 },
  { value: 'free', label: 'Free Form', width: 0, height: 0 },
];

const socialPresets = [
  { value: 'instagram-post', label: 'Instagram Post', ratio: '1:1' },
  { value: 'instagram-story', label: 'Instagram Story', ratio: '9:16' },
  { value: 'facebook-cover', label: 'Facebook Cover', ratio: '16:9' },
  { value: 'linkedin-post', label: 'LinkedIn Post', ratio: '4:3' },
  { value: 'twitter-header', label: 'Twitter Header', ratio: '3:1' },
  { value: 'youtube-thumbnail', label: 'YouTube Thumbnail', ratio: '16:9' },
];

export const CropTool: React.FC<CropToolProps> = ({ 
  imageUrl, 
  onCropApply, 
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    if (imageUrl) {
      loadImageAndInitCrop();
    }
  }, [imageUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [cropBox, showGuides]);

  const loadImageAndInitCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      
      // Initialize crop box in center
      setCropBox({
        x: 128,
        y: 128,
        width: 256,
        height: 256
      });
    };
    img.src = imageUrl;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, 512, 512);
      
      // Draw overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear crop area
      ctx.clearRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      ctx.drawImage(img, 
        cropBox.x, cropBox.y, cropBox.width, cropBox.height,
        cropBox.x, cropBox.y, cropBox.width, cropBox.height
      );
      
      // Draw crop box border
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      
      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = '#4ecdc4';
      const corners = [
        { x: cropBox.x - handleSize/2, y: cropBox.y - handleSize/2 },
        { x: cropBox.x + cropBox.width - handleSize/2, y: cropBox.y - handleSize/2 },
        { x: cropBox.x - handleSize/2, y: cropBox.y + cropBox.height - handleSize/2 },
        { x: cropBox.x + cropBox.width - handleSize/2, y: cropBox.y + cropBox.height - handleSize/2 },
      ];
      
      corners.forEach(corner => {
        ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
      });
      
      // Draw rule of thirds guides
      if (showGuides) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Vertical guides
        const vLine1 = cropBox.x + cropBox.width / 3;
        const vLine2 = cropBox.x + (cropBox.width * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(vLine1, cropBox.y);
        ctx.lineTo(vLine1, cropBox.y + cropBox.height);
        ctx.moveTo(vLine2, cropBox.y);
        ctx.lineTo(vLine2, cropBox.y + cropBox.height);
        ctx.stroke();
        
        // Horizontal guides
        const hLine1 = cropBox.y + cropBox.height / 3;
        const hLine2 = cropBox.y + (cropBox.height * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(cropBox.x, hLine1);
        ctx.lineTo(cropBox.x + cropBox.width, hLine1);
        ctx.moveTo(cropBox.x, hLine2);
        ctx.lineTo(cropBox.x + cropBox.width, hLine2);
        ctx.stroke();
      }
    };
    img.src = imageUrl;
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const isInCropBox = (pos: { x: number; y: number }) => {
    return pos.x >= cropBox.x && pos.x <= cropBox.x + cropBox.width &&
           pos.y >= cropBox.y && pos.y <= cropBox.y + cropBox.height;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setDragStart(pos);
    
    if (isInCropBox(pos)) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const pos = getMousePos(e);
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;
    
    setCropBox(prev => ({
      ...prev,
      x: Math.max(0, Math.min(512 - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(512 - prev.height, prev.y + deltaY))
    }));
    
    setDragStart(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleRatioChange = (ratio: string) => {
    setSelectedRatio(ratio);
    
    if (ratio !== 'free') {
      const ratioData = aspectRatios.find(r => r.value === ratio);
      if (ratioData && ratioData.width && ratioData.height) {
        const newHeight = (cropBox.width * ratioData.height) / ratioData.width;
        setCropBox(prev => ({
          ...prev,
          height: newHeight
        }));
      }
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetData = socialPresets.find(p => p.value === preset);
    if (presetData) {
      handleRatioChange(presetData.ratio);
    }
  };

  const applyCrop = () => {
    const cropSettings: CropSettings = {
      aspectRatio: selectedRatio,
      preset: selectedPreset || 'manual',
      x: cropBox.x / 512,
      y: cropBox.y / 512,
      width: cropBox.width / 512,
      height: cropBox.height / 512
    };
    
    onCropApply(cropSettings);
  };

  const resetCrop = () => {
    setCropBox({
      x: 128,
      y: 128,
      width: 256,
      height: 256
    });
    setSelectedRatio('1:1');
    setSelectedPreset('');
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Crop</h3>
        <Badge variant="secondary">AI Composition</Badge>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
            <Select value={selectedRatio} onValueChange={handleRatioChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select ratio" />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map(ratio => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Social Preset</label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose preset" />
              </SelectTrigger>
              <SelectContent>
                {socialPresets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          className="border border-border rounded-lg cursor-move w-full max-w-md mx-auto"
          style={{ aspectRatio: '1:1' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="rounded"
            />
            Rule of thirds guides
          </label>
        </div>
        
        <Separator />
        
        <div className="flex gap-2 justify-center">
          <Button onClick={resetCrop} variant="outline" size="sm">
            Reset
          </Button>
          <Button onClick={applyCrop} size="sm">
            Apply Crop
          </Button>
        </div>
      </div>
    </Card>
  );
};