import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Undo2, RotateCcw, Check, X, Brush } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingOverlayProps {
  imageUrl: string;
  onMaskComplete: (maskDataUrl: string, maskBlob: Blob) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  mode: 'remove' | 'add';
}

interface Stroke {
  points: { x: number; y: number }[];
  brushSize: number;
}

export function DrawingOverlay({ 
  imageUrl, 
  onMaskComplete, 
  onCancel, 
  isProcessing = false,
  mode 
}: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const container = containerRef.current;
    
    if (!canvas || !image || !container || !imageLoaded) return;

    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 32; // Account for padding
    const maxHeight = Math.min(600, containerRect.height - 120); // Leave space for controls

    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    
    let displayWidth, displayHeight;
    
    if (maxWidth / maxHeight > imageAspectRatio) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * imageAspectRatio;
    } else {
      displayWidth = maxWidth;
      displayHeight = displayWidth / imageAspectRatio;
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    image.style.width = `${displayWidth}px`;
    image.style.height = `${displayHeight}px`;
    
    setCanvasReady(true);
    redraw();
  }, [imageLoaded]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = mode === 'remove' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  }, [strokes, canvasReady, mode]);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    const handleError = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    if (image.complete) {
      handleLoad();
    } else {
      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleError);
    }

    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [imageUrl]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [{ x, y }],
      brushSize,
    };
    setStrokes(prev => [...prev, newStroke]);
  };

  const continueDrawing = (x: number, y: number) => {
    if (!isDrawing) return;
    
    setStrokes(prev => {
      const updated = [...prev];
      const currentStroke = updated[updated.length - 1];
      if (currentStroke) {
        currentStroke.points.push({ x, y });
      }
      return updated;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    startDrawing(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    continueDrawing(pos.x, pos.y);
  };

  const handleMouseUp = () => stopDrawing();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    startDrawing(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(touch.clientX, touch.clientY);
    continueDrawing(pos.x, pos.y);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopDrawing();
  };

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const clear = () => {
    setStrokes([]);
  };

  const exportMask = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;

    // Create a new canvas for the mask
    const maskCanvas = document.createElement('canvas');
    const image = imageRef.current;
    if (!image) return;

    maskCanvas.width = image.naturalWidth;
    maskCanvas.height = image.naturalHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Scale factor to convert from display coordinates to natural image coordinates
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;

    // Fill with black (background)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw strokes in white (masked areas)
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.strokeStyle = 'white';
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      maskCtx.lineWidth = stroke.brushSize * scaleX; // Scale brush size
      maskCtx.beginPath();
      maskCtx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
      
      for (let i = 1; i < stroke.points.length; i++) {
        maskCtx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
      }
      
      maskCtx.stroke();
    });

    // Convert to blob and data URL
    maskCanvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = maskCanvas.toDataURL('image/png');
        onMaskComplete(dataUrl, blob);
      }
    }, 'image/png');
  };

  if (imageError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg border shadow-lg">
          <p className="text-foreground mb-4">Failed to load image</p>
          <Button onClick={onCancel} variant="outline">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        ref={containerRef}
        className="bg-canvas-surface rounded-lg border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brush className="h-5 w-5 text-canvas-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              {mode === 'remove' ? 'Mark areas to remove' : 'Mark areas to add objects'}
            </h3>
            <Badge variant={mode === 'remove' ? 'destructive' : 'default'}>
              {mode === 'remove' ? 'Remove Mode' : 'Add Mode'}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
          {!imageLoaded ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-canvas-accent mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading image...</p>
            </div>
          ) : (
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Edit target"
                className="rounded-lg shadow-lg"
                style={{ display: canvasReady ? 'block' : 'none' }}
              />
              
              <canvas
                ref={canvasRef}
                className={cn(
                  "absolute top-0 left-0 cursor-crosshair rounded-lg",
                  isProcessing && "pointer-events-none"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ display: canvasReady ? 'block' : 'none' }}
              />
              
              {!canvasReady && imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse bg-muted rounded-lg w-full h-full"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border bg-canvas-bg/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Brush Size:</span>
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => setBrushSize(value)}
                  min={5}
                  max={50}
                  step={1}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground w-8">{brushSize}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={strokes.length === 0 || isProcessing}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clear}
                disabled={strokes.length === 0 || isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Paint over areas you want to {mode === 'remove' ? 'remove' : 'modify'}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              
              <Button
                onClick={exportMask}
                disabled={strokes.length === 0 || isProcessing}
                className="bg-canvas-accent hover:bg-canvas-accent/90"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Apply {mode === 'remove' ? 'Removal' : 'Addition'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}