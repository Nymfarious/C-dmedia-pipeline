import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Video, Upload } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';

interface VideoGenerationToolProps {
  isActive: boolean;
  onClose: () => void;
}

export const VideoGenerationTool: React.FC<VideoGenerationToolProps> = ({ isActive, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [motionStrength, setMotionStrength] = useState([0.8]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  
  const { assets, addAsset, selectedAssetIds } = useAppStore();
  
  // Get the currently selected asset if any
  const selectedAsset = selectedAssetIds.length > 0 ? assets[selectedAssetIds[0]] : null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for video generation');
      return;
    }

    let imageUrl = selectedImageUrl;
    
    // If no image selected but selected asset exists, use it
    if (!imageUrl && selectedAsset && selectedAsset.type === 'image') {
      imageUrl = selectedAsset.src;
    }

    if (!imageUrl) {
      toast.error('Please select an image for video generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      const adapter = providers.videoGen['replicate.veo-3'];
      const result = await adapter.generate({
        prompt,
        imageUrl,
        duration,
        aspectRatio,
        motionStrength: motionStrength[0]
      });

      addAsset(result);
      toast.success('Video generated successfully!');
      onClose();
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isActive) return null;

  return (
    <Card className="absolute top-16 left-4 right-4 z-50 p-6 bg-background border-border shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Video Generation (VEO 3)</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        {/* Image Input */}
        <div>
          <Label htmlFor="image-input" className="text-sm font-medium text-foreground">
            Source Image
          </Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-input')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Select Image
            </Button>
            {selectedImageUrl && (
              <div className="text-sm text-muted-foreground">
                Image selected ✓
              </div>
            )}
            {!selectedImageUrl && selectedAsset?.type === 'image' && (
              <div className="text-sm text-muted-foreground">
                Current canvas image will be used
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium text-foreground">
            Motion Prompt
          </Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the motion and animation you want..."
            className="mt-1"
          />
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="duration" className="text-sm font-medium text-foreground">
            Duration: {duration}s
          </Label>
          <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <Label htmlFor="aspect" className="text-sm font-medium text-foreground">
            Aspect Ratio
          </Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Motion Strength */}
        <div>
          <Label className="text-sm font-medium text-foreground">
            Motion Strength: {motionStrength[0].toFixed(1)}
          </Label>
          <Slider
            value={motionStrength}
            onValueChange={setMotionStrength}
            max={1}
            min={0.1}
            step={0.1}
            className="mt-2"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateVideo}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};