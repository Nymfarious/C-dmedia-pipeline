import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eraser, Undo, RotateCcw, Paintbrush, Bug, AlertTriangle } from 'lucide-react';

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
  const [maskWarning, setMaskWarning] = useState<string | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Setup canvas dimensions and positioning ONLY - no drawing operations
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    console.log('🔧 Setup canvas called:', { canvas: !!canvas, container: !!container, img: !!img });
    
    if (!canvas || !container || !img) {
      console.warn('⚠️ Missing refs for canvas setup');
      return;
    }

    // Get the actual displayed image dimensions from the img element
    const imgRect = img.getBoundingClientRect();
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;

    console.log('📏 Image display dimensions:', { displayWidth, displayHeight });
    console.log('🖼️ Image natural dimensions:', { natural: `${img.naturalWidth}x${img.naturalHeight}` });

    // Fallback if image has no dimensions yet
    if (displayWidth === 0 || displayHeight === 0) {
      console.warn('⚠️ Image has no display dimensions, using fallback');
      setTimeout(() => setupCanvas(), 100);
      return;
    }

    // Set canvas internal resolution to match the natural image resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Set CSS size to exactly match the displayed image
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Position canvas to cover the entire image area
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.bottom = '0';
    canvas.style.margin = 'auto';
    
    console.log('🎯 Canvas setup:', { 
      naturalWidth: canvas.width, 
      naturalHeight: canvas.height,
      displayWidth, 
      displayHeight 
    });
    
    // Update debug info
    setDebugInfo({
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      displayWidth,
      displayHeight,
      scale: Math.min(displayWidth / img.naturalWidth, displayHeight / img.naturalHeight),
      imageNaturalWidth: img.naturalWidth,
      imageNaturalHeight: img.naturalHeight
    });
    
    // Initialize canvas ONLY once - prevent repeated clearing
    if (!canvasInitialized) {
      initializeCanvas();
      setCanvasInitialized(true);
    }
    
    setCanvasReady(true);
    setReady(true);
    
    console.log('✅ Canvas setup complete - dimensions configured, preserving user drawings');
  }, [canvasInitialized]);

  // Separate function to initialize canvas with black background
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Initialize with black background (preserve areas)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('🎨 Canvas initialized with black background');
    }
  }, []);

  // Clear canvas (for explicit user action)
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('🧹 Canvas cleared explicitly');
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

  // Debounced redraw to prevent rapid cycles and preserve user input
  const redrawTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redrawRequestedRef = useRef(false);
  
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready || !canvasInitialized) return;
    
    // Prevent overlapping redraws
    if (redrawRequestedRef.current) return;
    redrawRequestedRef.current = true;
    
    // Clear any pending redraw
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current);
    }
    
    redrawTimeoutRef.current = setTimeout(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        redrawRequestedRef.current = false;
        return;
      }
      
      // Start fresh with black background (areas to preserve)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Only draw user strokes if we have them
      if (strokes.length > 0) {
        // Draw white strokes (areas to inpaint) - FLUX expects white pixels for inpainting
        ctx.fillStyle = '#FFFFFF';
        ctx.globalCompositeOperation = 'source-over';
        
        for (const stroke of strokes) {
          ctx.beginPath();
          ctx.arc(stroke.x, stroke.y, stroke.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Validate mask quality after redraw
      validateMaskQuality();
      redrawRequestedRef.current = false;
    }, 16); // ~60fps
  }, [strokes, ready, canvasInitialized]);

  // Validate mask quality and provide warnings
  const validateMaskQuality = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) {
      setMaskWarning(null);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let whitePixels = 0;
    let totalPixels = canvas.width * canvas.height;

    // Count white pixels (mask areas)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 128 && g > 128 && b > 128) {
        whitePixels++;
      }
    }

    const coverage = (whitePixels / totalPixels) * 100;

    if (coverage > 80) {
      setMaskWarning('⚠️ Large mask area detected. This will affect most of the image.');
    } else if (coverage < 0.1) {
      setMaskWarning('⚠️ Very small mask area. Try using a larger brush or drawing more.');
    } else {
      setMaskWarning(null);
    }
  }, [strokes]);

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

  const clear = () => {
    setStrokes([]);
    clearCanvas();
    setMaskWarning(null);
  };

  const exportMask = async () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) {
      console.warn('⚠️ No mask to export');
      setMaskWarning('⚠️ Please draw on the image first to create a mask.');
      return;
    }
    
    // Enhanced pre-export validation
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Force a final redraw to ensure canvas state is current
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (strokes.length > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.globalCompositeOperation = 'source-over';
      
      for (const stroke of strokes) {
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, stroke.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let whitePixels = 0;
    let blackPixels = 0;
    let totalPixels = canvas.width * canvas.height;
    
    // Count white and black pixels to validate mask
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 128 && g > 128 && b > 128) {
        whitePixels++;
      } else if (r < 128 && g < 128 && b < 128) {
        blackPixels++;
      }
    }
    
    const coverage = (whitePixels / totalPixels) * 100;
    const blackCoverage = (blackPixels / totalPixels) * 100;
    
    console.log('🔍 Mask analysis:', { 
      whitePixels, 
      blackPixels, 
      totalPixels, 
      coverage: coverage.toFixed(2) + '%',
      blackCoverage: blackCoverage.toFixed(2) + '%'
    });
    
    // Enhanced validation - prevent problematic masks
    if (coverage > 90) {
      console.error('❌ Mask covers almost the entire image');
      setMaskWarning('❌ Mask is too large. This would affect most of the image. Please draw a smaller area.');
      return;
    }
    
    if (coverage < 0.1) {
      console.error('❌ Mask is too small');
      setMaskWarning('❌ Mask area is too small. Please draw a larger area or use a bigger brush.');
      return;
    }
    
    if (blackCoverage < 50) {
      console.error('❌ Mask may be inverted or corrupted');
      setMaskWarning('❌ Mask appears corrupted. Please clear and redraw your mask.');
      return;
    }
    
    console.log('✅ Exporting valid mask with', coverage.toFixed(2), '% coverage');
    setMaskWarning(null);
    
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

        {/* Mask Quality Warning */}
        {maskWarning && (
          <Alert className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{maskWarning}</AlertDescription>
          </Alert>
        )}

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
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Image */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Reference"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '70vh' }}
              draggable={false}
            />
            
            {/* Drawing Canvas Overlay - covers entire image */}
            <canvas
              ref={canvasRef}
              className="absolute cursor-crosshair"
              style={{ 
                mixBlendMode: 'multiply',
                opacity: 0.7,
                touchAction: 'none',
                pointerEvents: canvasReady ? 'auto' : 'none',
                zIndex: 10
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
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
