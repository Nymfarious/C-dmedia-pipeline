import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Upload } from 'lucide-react';
import { VideoGenerationTool } from './VideoGenerationTool';
import { Asset } from '@/types/media';

interface VideoCanvasProps {
  asset?: Asset;
  onAssetUpdate?: (asset: Asset) => void;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({ asset, onAssetUpdate }) => {
  const [isVideoToolActive, setIsVideoToolActive] = useState(false);

  const handleAssetGenerated = (generatedAsset: Asset) => {
    console.log('VideoCanvas - Video generated:', generatedAsset.id);
    if (onAssetUpdate) {
      onAssetUpdate(generatedAsset);
    }
    setIsVideoToolActive(false);
  };

  if (asset && asset.type === 'video') {
    return (
      <div className="relative h-full bg-stage-bg">
        <Card className="h-full flex items-center justify-center bg-card border-border">
          <div className="text-center">
            <video 
              src={asset.src}
              controls
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              autoPlay={false}
            >
              Your browser does not support the video tag.
            </video>
            <div className="mt-4 space-y-2">
              <p className="text-lg font-medium text-foreground">{asset.name}</p>
              {asset.meta?.duration && (
                <p className="text-sm text-muted-foreground">
                  Duration: {asset.meta.duration}s
                </p>
              )}
            </div>
          </div>
        </Card>

        <VideoGenerationTool
          isActive={isVideoToolActive}
          onClose={() => setIsVideoToolActive(false)}
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
    </div>
  );
};