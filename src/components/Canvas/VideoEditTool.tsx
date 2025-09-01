import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, Wand2, Settings, Sparkles } from 'lucide-react';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';
import { circuitBreaker } from '@/middleware/circuitBreaker';
import { retryWithBackoff, showErrorToast } from '@/lib/errorHandler';

interface VideoEditToolProps {
  asset: Asset;
  isActive: boolean;
  onClose: () => void;
}

export const VideoEditTool: React.FC<VideoEditToolProps> = ({ asset, isActive, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [motionStrength, setMotionStrength] = useState([0.8]);
  const [structureStrength, setStructureStrength] = useState([0.7]);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState<number | undefined>();
  
  // Add circuit breaker configuration
  const { addAsset } = useAppStore();

  const handleVideoEdit = async () => {
    if (!prompt.trim()) {
      showErrorToast('Please enter a prompt for video editing', 'Video Edit');
      return;
    }

    if (asset.type !== 'video') {
      showErrorToast('Please select a video asset to edit', 'Video Edit');
      return;
    }

    setIsEditing(true);
    
    try {
      const adapter = providers.videoEdit['replicate.sedance-1-pro'];
      
      const result = await circuitBreaker.execute(
        'sedance-video-edit',
        () => retryWithBackoff(() => adapter.edit(asset, {
          prompt,
          motionStrength: motionStrength[0],
          structureStrength: structureStrength[0],
          seed,
          numFrames: 16,
          fps: 8,
          aspectRatio: asset.meta?.aspectRatio || "16:9"
        }), 2, 2000) // Fewer retries for video editing due to longer processing time
      );

      addAsset(result);
      toast.success('Video edited successfully with SeDance-1 Pro!');
      onClose();
    } catch (error) {
      console.error('Video editing error:', error);
      showErrorToast(error, 'Video Edit');
    } finally {
      setIsEditing(false);
    }
  };

  if (!isActive) return null;

  return (
    <Card className="absolute top-16 left-4 right-4 z-50 p-6 bg-background border-border shadow-lg max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Video Editing (SeDance-1 Pro)</h3>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Advanced AI
          </Badge>
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

      <div className="space-y-6">
        {/* Source Video Info */}
        <div className="border border-border rounded-lg p-4">
          <Label className="text-sm font-medium text-foreground mb-2 block">Source Video</Label>
          <div className="flex items-center gap-3">
            <video 
              src={asset.src} 
              className="w-20 h-20 object-cover rounded border"
              muted
            />
            <div>
              <p className="font-medium">{asset.name}</p>
              <div className="flex gap-2 mt-1">
                {asset.meta?.aspectRatio && (
                  <Badge variant="outline" className="text-xs">
                    {asset.meta.aspectRatio}
                  </Badge>
                )}
                {asset.meta?.duration && (
                  <Badge variant="outline" className="text-xs">
                    {asset.meta.duration}s
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium text-foreground">
            Edit Instructions
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how you want to edit the video (e.g., 'make it more dynamic', 'add swaying motion to the trees', 'increase the speed of movement')"
            className="mt-1 resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be specific about the motion changes you want to apply
          </p>
        </div>

        {/* Advanced Settings */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Settings
          </Label>
          
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
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Subtle</span>
              <span>Dramatic</span>
            </div>
          </div>

          {/* Structure Strength */}
          <div>
            <Label className="text-sm font-medium text-foreground">
              Structure Preservation: {structureStrength[0].toFixed(1)}
            </Label>
            <Slider
              value={structureStrength}
              onValueChange={setStructureStrength}
              max={1}
              min={0.1}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>More Changes</span>
              <span>Keep Original</span>
            </div>
          </div>

          {/* Seed */}
          <div>
            <Label className="text-sm font-medium text-foreground">
              Seed (Optional)
            </Label>
            <Input
              type="number"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave empty for random"
              className="mt-1 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use the same seed for consistent results
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <Button
          onClick={handleVideoEdit}
          disabled={isEditing || !prompt.trim()}
          className="w-full"
        >
          {isEditing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Editing Video...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Edit Video with SeDance-1 Pro
            </>
          )}
        </Button>
        
        {isEditing && (
          <p className="text-xs text-muted-foreground text-center">
            This may take 2-4 minutes. Please wait...
          </p>
        )}
      </div>
    </Card>
  );
};