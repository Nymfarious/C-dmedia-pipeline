import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Upload, Play, Pause, Download, Share, Wand2 } from 'lucide-react';
import { VideoGenerationTool } from './VideoGenerationTool';
import { VideoEditTool } from './VideoEditTool';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';

interface VideoCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({ asset, onAssetUpdate }) => {
  const [isVideoToolActive, setIsVideoToolActive] = useState(false);
  const [isVideoEditActive, setIsVideoEditActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const { activeTool, setActiveTool } = useAppStore();

  // Listen for global video generation events
  useEffect(() => {
    const handleVideoGeneration = () => {
      setIsVideoToolActive(true);
    };

    window.addEventListener('openVideoGeneration', handleVideoGeneration);
    return () => window.removeEventListener('openVideoGeneration', handleVideoGeneration);
  }, []);

  const handleAssetGenerated = (generatedAsset: Asset) => {
    console.log('VideoCanvas - Video generated:', generatedAsset.id);
    if (onAssetUpdate) {
      onAssetUpdate(generatedAsset);
    }
    setIsVideoToolActive(false);
  };

  const togglePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadVideo = () => {
    if (asset?.src) {
      const link = document.createElement('a');
      link.href = asset.src;
      link.download = asset.name || 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareVideo = async () => {
    if (navigator.share && asset?.src) {
      try {
        await navigator.share({
          title: asset.name,
          url: asset.src
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(asset.src);
      }
    }
  };

  if (asset && asset.type === 'video') {
    return (
      <div className="relative h-full bg-stage-bg">
        <Card className="h-full flex flex-col bg-card border-border">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-4xl">
              <div className="relative inline-block">
                <video 
                  ref={setVideoRef}
                  src={asset.src}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
                  autoPlay={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={togglePlayPause}
                    className="bg-background/90 backdrop-blur-sm"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{asset.name}</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  {asset.meta?.duration && (
                    <Badge variant="secondary">
                      Duration: {asset.meta.duration}s
                    </Badge>
                  )}
                  {asset.meta?.aspectRatio && (
                    <Badge variant="secondary">
                      {asset.meta.aspectRatio}
                    </Badge>
                  )}
                  {asset.meta?.provider && (
                    <Badge variant="outline">
                      {asset.meta.provider}
                    </Badge>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={downloadVideo}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareVideo}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsVideoToolActive(true)}>
                    <Video className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsVideoEditActive(true)}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Edit Video
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <VideoGenerationTool
          isActive={isVideoToolActive}
          onClose={() => setIsVideoToolActive(false)}
        />
        
        <VideoEditTool
          asset={asset}
          isActive={isVideoEditActive}
          onClose={() => setIsVideoEditActive(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full bg-stage-bg">
      <Card className="h-full flex items-center justify-center bg-card border-border">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">Video Canvas</p>
          <p className="text-sm mb-6">Create stunning videos from images using VEO 3</p>
          
          <div className="space-y-3">
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
              onClick={() => setIsVideoToolActive(true)}
            >
              <Video className="h-4 w-4 mr-2" />
              Generate Video
            </Button>
            
            <div className="text-xs text-muted-foreground">
              Or upload an image to get started
            </div>
            
            <Button 
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </div>
      </Card>

      <VideoGenerationTool
        isActive={isVideoToolActive}
        onClose={() => setIsVideoToolActive(false)}
      />
      
      <VideoEditTool
        asset={asset}
        isActive={isVideoEditActive}
        onClose={() => setIsVideoEditActive(false)}
      />
    </div>
  );
};