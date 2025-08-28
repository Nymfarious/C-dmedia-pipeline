import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eraser, Undo } from 'lucide-react';

interface BrushToolProps {
  onMaskComplete: (mask: { x: number; y: number; radius: number }[]) => void;
  imageUrl: string;
  className?: string;
}

export function BrushTool({ onMaskComplete, imageUrl, className }: BrushToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([20]);
  const [maskStrokes, setMaskStrokes] = useState<{ x: number; y: number; radius: number }[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getMousePos = useCallback((canvas: HTMLCanvasElement, e: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(canvas, e);
    const newStroke = { x: pos.x, y: pos.y, radius: brushSize[0] };
    setMaskStrokes(prev => [...prev, newStroke]);
    
    drawBrushStroke(pos.x, pos.y, brushSize[0]);
  }, [imageLoaded, brushSize, getMousePos]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageLoaded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(canvas, e);
    const newStroke = { x: pos.x, y: pos.y, radius: brushSize[0] };
    setMaskStrokes(prev => [...prev, newStroke]);
    
    drawBrushStroke(pos.x, pos.y, brushSize[0]);
  }, [isDrawing, imageLoaded, brushSize, getMousePos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const drawBrushStroke = useCallback((x: number, y: number, radius: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const clearMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setMaskStrokes([]);
    
    // Redraw original image
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const applyMask = useCallback(() => {
    onMaskComplete(maskStrokes);
  }, [maskStrokes, onMaskComplete]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eraser className="h-4 w-4" />
            <span className="text-sm">Brush Size:</span>
          </div>
          <Slider
            value={brushSize}
            onValueChange={setBrushSize}
            max={50}
            min={5}
            step={1}
            className="w-32"
          />
          <span className="text-sm w-8">{brushSize[0]}</span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearMask}>
            <Undo className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" onClick={applyMask} disabled={maskStrokes.length === 0}>
            Apply Mask
          </Button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="border rounded-lg cursor-crosshair max-w-full max-h-96 object-contain"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}