import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaskPreviewProps {
  maskDataUrl: string;
  imageUrl: string;
  className?: string;
}

export function MaskPreview({ maskDataUrl, imageUrl, className }: MaskPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMask, setShowMask] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load both images
    const img = new Image();
    const maskImg = new Image();
    
    img.crossOrigin = 'anonymous';
    maskImg.crossOrigin = 'anonymous';
    
    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        if (showMask) {
          // Overlay the mask with some transparency
          ctx.globalAlpha = 0.6;
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(maskImg, 0, 0, img.naturalWidth, img.naturalHeight);
          
          // Highlight white areas (inpaint areas) in a distinct color
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#ff0000'; // Red overlay for inpaint areas
          
          // Create a temporary canvas to detect white pixels in mask
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            tempCtx.drawImage(maskImg, 0, 0, img.naturalWidth, img.naturalHeight);
            
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Create highlight overlay for white pixels
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Check if pixel is white (inpaint area)
              if (r > 200 && g > 200 && b > 200) {
                const x = (i / 4) % tempCanvas.width;
                const y = Math.floor((i / 4) / tempCanvas.width);
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        }
        
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        setIsLoading(false);
      }
    };
    
    img.onload = onImageLoad;
    maskImg.onload = onImageLoad;
    
    img.src = imageUrl;
    maskImg.src = maskDataUrl;
    
  }, [maskDataUrl, imageUrl, showMask]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Mask Preview</span>
          <div className="flex items-center gap-2">
            <Badge variant={showMask ? "default" : "secondary"}>
              {showMask ? "Mask Visible" : "Original Only"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMask(!showMask)}
            >
              {showMask ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-muted rounded-lg border border-border overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-sm text-muted-foreground">Loading preview...</div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-48 object-contain"
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {showMask && "Red areas show what will be inpainted (white pixels in mask)"}
          {!showMask && "Click the eye icon to show the inpaint mask overlay"}
        </div>
      </CardContent>
    </Card>
  );
}