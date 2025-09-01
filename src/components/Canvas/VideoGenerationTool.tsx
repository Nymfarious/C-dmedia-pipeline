import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Upload, Sparkles, Clock, Volume2, VolumeX, Dice6, History } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { providers } from '@/adapters/registry';
import { toast } from 'sonner';
import { VideoHistoryPanel } from './VideoHistoryPanel';

interface VideoGenerationToolProps {
  isActive: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  motionStrength: number;
  style?: string;
  seed?: number;
  enableAudio: boolean;
  timestamp: string;
  assetId: string;
}

// Style presets for different video aesthetics
const STYLE_PRESETS = {
  cinematic: {
    name: 'Cinematic',
    description: 'Film-like quality with dramatic lighting',
    promptPrefix: 'cinematic, dramatic lighting, high quality film,'
  },
  realistic: {
    name: 'Realistic',
    description: 'Natural, photorealistic movement',
    promptPrefix: 'realistic, natural movement, photorealistic,'
  },
  artistic: {
    name: 'Artistic',
    description: 'Creative, stylized animation',
    promptPrefix: 'artistic, stylized, creative animation,'
  },
  smooth: {
    name: 'Smooth Motion',
    description: 'Fluid, seamless transitions',
    promptPrefix: 'smooth motion, fluid animation, seamless,'
  }
};

export const VideoGenerationTool: React.FC<VideoGenerationToolProps> = ({ isActive, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [motionStrength, setMotionStrength] = useState([0.8]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [enableAudio, setEnableAudio] = useState(true);
  const [seed, setSeed] = useState<number | undefined>();
  const [isDragOver, setIsDragOver] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState('replicate.veo-3');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { assets, addAsset, selectedAssetIds } = useAppStore();
  
  // Get the currently selected asset if any
  const selectedAsset = selectedAssetIds.length > 0 ? assets[selectedAssetIds[0]] : null;

  // Calculate estimated generation time based on duration
  React.useEffect(() => {
    const baseTime = 30; // Base time in seconds
    const timePerSecond = 15; // Additional time per video second
    setEstimatedTime(baseTime + (duration * timePerSecond));
  }, [duration]);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
      toast.success('Image loaded successfully');
    } else {
      toast.error('Please select a valid image file');
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Please drop a valid image file');
    }
  }, [handleFileSelect]);

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const applyStylePreset = (presetKey: string) => {
    const preset = STYLE_PRESETS[presetKey as keyof typeof STYLE_PRESETS];
    if (preset) {
      setSelectedStyle(presetKey);
      if (!prompt.includes(preset.promptPrefix)) {
        setPrompt(prev => `${preset.promptPrefix} ${prev}`.trim());
      }
    }
  };

  const handleHistoryReuse = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setDuration(item.duration);
    setAspectRatio(item.aspectRatio);
    setMotionStrength([item.motionStrength]);
    setSelectedStyle(item.style || '');
    setSeed(item.seed);
    setEnableAudio(item.enableAudio);
  };

  const convertBlobToDataUrl = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert blob to data URL:', error);
      throw new Error('Failed to process image. Please try uploading a different image.');
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

    // Show upload progress for blob URLs
    if (!imageUrl) {
      toast.error('Please select an image for video generation');
      return;
    }

    let processedImageUrl = imageUrl;
    
    // Convert blob URLs to data URLs before sending to server
    if (imageUrl.startsWith('blob:')) {
      toast.info('Processing image for video generation...');
      try {
        processedImageUrl = await convertBlobToDataUrl(imageUrl);
        console.log('Converted blob URL to data URL for video generation');
      } catch (error) {
        toast.error('Failed to process image. Please try uploading a different image.');
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      const adapter = providers.videoGen[selectedModel as keyof typeof providers.videoGen];
      const result = await adapter.generate({
        prompt,
        imageUrl: processedImageUrl,
        duration,
        aspectRatio,
        motionStrength: motionStrength[0],
        seed,
        enableAudio
      });

      addAsset(result);
      
      // Save to generation history
      const historyItem = {
        id: Date.now().toString(),
        prompt,
        duration,
        aspectRatio,
        motionStrength: motionStrength[0],
        style: selectedStyle,
        seed,
        enableAudio,
        timestamp: new Date().toISOString(),
        assetId: result.id
      };
      
      const history = JSON.parse(localStorage.getItem('videoGenerationHistory') || '[]');
      history.unshift(historyItem);
      localStorage.setItem('videoGenerationHistory', JSON.stringify(history.slice(0, 20))); // Keep last 20
      
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
    <Card className="absolute top-16 left-4 right-4 z-50 p-6 bg-background border-border shadow-lg max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Video Generation</h3>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            ~{Math.ceil(estimatedTime / 60)}min
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Video Generation Model
          </Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="replicate.veo-3">VEO-3 (Google) - High Quality</SelectItem>
              <SelectItem value="replicate.runway-ml">RunwayML Gen-3 - Cinematic</SelectItem>
              <SelectItem value="replicate.stable-video">Stable Video Diffusion - Fast</SelectItem>
              <SelectItem value="replicate.animatediff">AnimateDiff - Animation</SelectItem>
              <SelectItem value="replicate.luma-dream">Luma Dream Machine - Creative</SelectItem>
              <SelectItem value="replicate.kling-ai">Kling AI - Professional</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedModel === 'replicate.veo-3' && 'Best quality, longer generation time'}
            {selectedModel === 'replicate.runway-ml' && 'Cinematic quality, great for professional videos'}
            {selectedModel === 'replicate.stable-video' && 'Fast generation, good for prototypes'}
            {selectedModel === 'replicate.animatediff' && 'Specialized for character animation'}
            {selectedModel === 'replicate.luma-dream' && 'Creative effects and surreal animations'}
            {selectedModel === 'replicate.kling-ai' && 'High-end quality, optimized for realism'}
          </p>
        </div>

        {/* Style Presets */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">
            <Sparkles className="h-4 w-4 inline mr-1" />
            Style Presets
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedStyle === key ? "default" : "outline"}
                size="sm"
                onClick={() => applyStylePreset(key)}
                className="text-xs h-auto p-2 flex flex-col items-start"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs opacity-70 text-left">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Drag & Drop Image Input */}
        <div>
          <Label className="text-sm font-medium text-foreground">
            Source Image
          </Label>
          <div 
            className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            {selectedImageUrl ? (
              <div className="space-y-2">
                <img src={selectedImageUrl} alt="Selected" className="w-20 h-20 object-cover rounded mx-auto" />
                <p className="text-sm text-primary font-medium">Image loaded ✓</p>
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">Drop an image here</p>
                  <p className="text-xs text-muted-foreground">or</p>
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
            {!selectedImageUrl && selectedAsset?.type === 'image' && (
              <p className="text-xs text-muted-foreground mt-2">
                Current canvas image will be used if no file selected
              </p>
            )}
          </div>
        </div>

        {/* Motion Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium text-foreground">
            Motion Prompt
          </Label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the motion and animation you want..."
            className="mt-1 w-full p-2 border border-border rounded-md bg-background text-foreground resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be specific about movement, camera angles, and visual effects
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Subtle</span>
            <span>Dynamic</span>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <Label className="text-sm font-medium text-foreground">Advanced Options</Label>
          
          {/* Audio Generation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enableAudio ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm">Generate Audio</span>
            </div>
            <Switch
              checked={enableAudio}
              onCheckedChange={setEnableAudio}
            />
          </div>

          {/* Seed Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Dice6 className="h-4 w-4" />
                Seed (Optional)
              </Label>
              <Button variant="ghost" size="sm" onClick={generateRandomSeed}>
                Random
              </Button>
            </div>
            <Input
              type="number"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave empty for random"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use the same seed for reproducible results
            </p>
          </div>
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

      <VideoHistoryPanel
        isActive={showHistory}
        onClose={() => setShowHistory(false)}
        onReuse={handleHistoryReuse}
      />
    </Card>
  );
};