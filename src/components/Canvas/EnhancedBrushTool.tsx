import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Eraser, Undo, RotateCcw, Paintbrush, Bug } from 'lucide-react';

type Stroke = { x: number; y: number; r: number };

interface EnhancedBrushToolProps {
  imageUrl: string;
  onExportMask: (mask: { dataUrl: string; blob: Blob }) => void;
  initialBrush?: number;
  className?: string;
  onCancel?: () => void;
}

export function EnhancedBrushTool({ 
  imageUrl, 
  onExportMask, 
  initialBrush = 24, 
  className,
  onCancel 
}: EnhancedBrushToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [ready, setReady] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState([initialBrush]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebug, setShowDebug] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Setup canvas to match image dimensions
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    console.log('🔧 Setup canvas called:', { canvas: !!canvas, container: !!container, img: !!img });
    
    if (!canvas || !container || !img) {
      console.warn('⚠️ Missing refs for canvas setup');
      return;
    }

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    console.log('📏 Container dimensions:', { containerWidth, containerHeight });
    console.log('🖼️ Image dimensions:', { natural: `${img.naturalWidth}x${img.naturalHeight}` });

    // Fallback if container has no dimensions yet
    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('⚠️ Container has no dimensions, using fallback');
      setTimeout(() => setupCanvas(), 100);
      return;
    }

    // Calculate scale to fit image in container
    const scaleX = containerWidth / img.naturalWidth;
    const scaleY = containerHeight / img.naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    // Set canvas size to match displayed image
    const displayWidth = Math.floor(img.naturalWidth * scale);
    const displayHeight = Math.floor(img.naturalHeight * scale);
    
    console.log('🎯 Canvas setup:', { scale, displayWidth, displayHeight });
    
    // Set canvas internal resolution
    canvas.width = img.naturalWidth; // Native resolution for mask
    canvas.height = img.naturalHeight;
    
    // Set CSS size to match displayed image
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Update debug info
    setDebugInfo({
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      displayWidth,
      displayHeight,
      scale,
      containerWidth,
      containerHeight,
      imageNaturalWidth: img.naturalWidth,
      imageNaturalHeight: img.naturalHeight
    });
    
    setCanvasReady(true);
    setReady(true);
    
    console.log('✅ Canvas setup complete');
    
    // Clear canvas and redraw
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Load and setup image with CORS fallback
  useEffect(() => {
    setImageLoaded(false);
    setImageError(null);
    setLoadAttempt(0);
    
    const tryLoadImage = (withCors: boolean = true) => {
      console.log(`🖼️ Loading image (attempt ${loadAttempt + 1}, CORS: ${withCors}):`, imageUrl);
      
      const img = new Image();
      
      if (withCors) {
        img.crossOrigin = 'anonymous';
      }
      
      img.onload = () => {
        console.log('✅ Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
        imageRef.current = img;
        setImageLoaded(true);
        setImageError(null);
      };
      
      img.onerror = (error) => {
        const errorMsg = `Failed to load image ${withCors ? 'with CORS' : 'without CORS'}: ${error}`;
        console.error('❌', errorMsg);
        
        if (withCors && loadAttempt === 0) {
          // Try again without CORS
          console.log('🔄 Retrying without CORS...');
          setLoadAttempt(1);
          setTimeout(() => tryLoadImage(false), 100);
        } else {
          setImageError(`Failed to load image. URL: ${imageUrl.substring(0, 100)}...`);
        }
      };
      
      // Test if URL is reachable first
      if (imageUrl.startsWith('http')) {
        fetch(imageUrl, { method: 'HEAD', mode: withCors ? 'cors' : 'no-cors' })
          .then(response => {
            console.log('🔍 URL accessibility test:', response.status, response.statusText);
            img.src = imageUrl;
          })
          .catch(fetchError => {
            console.warn('⚠️ URL accessibility test failed:', fetchError);
            // Still try to load the image directly
            img.src = imageUrl;
          });
      } else {
        img.src = imageUrl;
      }
    };
    
    tryLoadImage();
  }, [imageUrl]);

  // Setup canvas after image loads and container is ready
  useEffect(() => {
    if (imageLoaded && imageRef.current && containerRef.current) {
      console.log('🎯 Attempting canvas setup...');
      setupCanvas();
    }
  }, [imageLoaded, setupCanvas]);

  // Redraw the mask
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    
    const ctx = canvas.getContext('2d')!;
    
    // Clear with white (keep areas)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black strokes (edit areas)
    ctx.fillStyle = '#000000';
    ctx.globalCompositeOperation = 'source-over';
    
    for (const stroke of strokes) {
      ctx.beginPath();
      ctx.arc(stroke.x, stroke.y, stroke.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [strokes, ready]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded) {
        setupCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded, setupCanvas]);

  // Convert mouse/touch position to canvas coordinates
  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('⚠️ No canvas ref for coordinate calculation');
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY));
    
    console.log('📍 Mouse position:', { 
      client: { x: clientX, y: clientY },
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      scale: { x: scaleX, y: scaleY },
      canvas: { x, y }
    });
    
    return { x, y };
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('🖱️ Mouse down:', { ready, canvasReady });
    if (!ready || !canvasReady) {
      console.warn('⚠️ Canvas not ready for drawing');
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const { x, y } = getCanvasPos(e.clientX, e.clientY);
    const newStroke = { x, y, r: brush[0] };
    console.log('✏️ Adding stroke:', newStroke);
    setStrokes(prev => {
      const updated = [...prev, newStroke];
      console.log('📝 Total strokes:', updated.length);
      return updated;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ready || !canvasReady || !isDrawing) return;
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getCanvasPos(e.clientX, e.clientY);
    const newStroke = { x, y, r: brush[0] };
    setStrokes(prev => [...prev, newStroke]);
  };

  const handleMouseUp = () => {
    console.log('🖱️ Mouse up');
    setIsDrawing(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ready || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDrawing(true);
    const { x, y } = getCanvasPos(touch.clientX, touch.clientY);
    setStrokes(prev => [...prev, { x, y, r: brush[0] }]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!ready || !isDrawing || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCanvasPos(touch.clientX, touch.clientY);
    setStrokes(prev => [...prev, { x, y, r: brush[0] }]);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  // Actions
  const undo = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const clear = () => setStrokes([]);

  const exportMask = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    onExportMask({ dataUrl, blob });
  };

  return (
    <div className={className}>
      {/* Controls */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Paint the area to edit</span>
            <Badge variant="outline">{strokes.length} strokes</Badge>
            <Badge variant={canvasReady ? "default" : "destructive"}>
              {canvasReady ? "Ready" : "Setting up..."}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm">Brush Size:</span>
          <Slider 
            min={4} 
            max={120} 
            step={1} 
            value={brush} 
            onValueChange={setBrush} 
            className="flex-1 max-w-48" 
          />
          <span className="text-sm text-muted-foreground w-8">{brush[0]}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={undo} 
            disabled={strokes.length === 0}
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clear}
            disabled={strokes.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <div className="flex-1" />
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={exportMask} 
            disabled={strokes.length === 0}
          >
            Apply Mask
          </Button>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mt-4 p-3 bg-muted rounded border text-xs space-y-2">
            <div className="font-medium">Debug Information:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>Image Loaded: {imageLoaded ? '✅' : '❌'}</div>
              <div>Canvas Ready: {canvasReady ? '✅' : '❌'}</div>
              <div>Ready State: {ready ? '✅' : '❌'}</div>
              <div>Is Drawing: {isDrawing ? '✅' : '❌'}</div>
              <div>Strokes: {strokes.length}</div>
              <div>Brush Size: {brush[0]}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Image URL:</div>
              <div className="break-all text-xs bg-background p-1 rounded">{imageUrl}</div>
              {imageError && (
                <div className="text-red-500 font-medium">Error: {imageError}</div>
              )}
              <div>Load Attempts: {loadAttempt + 1}</div>
            </div>
            {debugInfo.canvasWidth && (
              <div className="space-y-1">
                <div className="font-medium">Canvas Info:</div>
                <div>Canvas: {debugInfo.canvasWidth}x{debugInfo.canvasHeight}</div>
                <div>Display: {debugInfo.displayWidth}x{debugInfo.displayHeight}</div>
                <div>Scale: {debugInfo.scale?.toFixed(3)}</div>
                <div>Container: {debugInfo.containerWidth}x{debugInfo.containerHeight}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative bg-card rounded-lg border border-border overflow-hidden"
        style={{ minHeight: '400px', maxHeight: '70vh' }}
      >
        {imageLoaded && (
          <>
            {/* Background Image */}
            <img
              src={imageUrl}
              alt="Reference"
              className="w-full h-full object-contain"
              style={{ maxHeight: '70vh' }}
              draggable={false}
            />
            
            {/* Drawing Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair border-2 border-red-500/20"
              style={{ 
                mixBlendMode: 'multiply',
                opacity: 0.7,
                touchAction: 'none',
                pointerEvents: canvasReady ? 'auto' : 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </>
        )}
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            {imageError ? (
              <div className="text-center space-y-2">
                <div className="text-red-500 font-medium">Failed to load image</div>
                <div className="text-xs text-muted-foreground max-w-md break-all">{imageError}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground">Loading image...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
