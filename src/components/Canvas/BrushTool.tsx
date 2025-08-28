import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eraser, Undo } from 'lucide-react';

type Stroke = { x: number; y: number; r: number };

interface BrushToolProps {
  imageUrl: string;                 // original image to align mask with
  onExportMask: (mask: { dataUrl: string; blob: Blob }) => void;
  initialBrush?: number;
  className?: string;
}

export function BrushTool({ imageUrl, onExportMask, initialBrush = 24, className }: BrushToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState([initialBrush]);
  const [isDrawing, setIsDrawing] = useState(false);

  // load base image to size canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      setReady(true);
      redraw(); // init clear
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    // Mask expected by most inpainting: white = keep, black = edit region
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    for (const s of strokes) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  }, [strokes]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPos = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);
    return { x, y };
  };

  const onDown = (e: React.MouseEvent) => {
    if (!ready) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    setStrokes(prev => [...prev, { x, y, r: brush[0] }]);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!ready || !isDrawing) return;
    const { x, y } = getPos(e);
    setStrokes(prev => [...prev, { x, y, r: brush[0] }]);
  };

  const onUp = () => setIsDrawing(false);
  const undo = () => setStrokes(prev => prev.slice(0, -1));
  const clear = () => setStrokes([]);

  const exportMask = async () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    onExportMask({ dataUrl, blob });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm">Brush</span>
        <Slider min={4} max={120} step={1} value={brush} onValueChange={setBrush} className="w-48" />
        <Button variant="outline" size="sm" onClick={undo} title="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={clear} title="Clear">
          <Eraser className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={exportMask}>Use this mask</Button>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[70vh]">
        {/* optional: show base image underneath as reference */}
        <div className="relative inline-block">
          {ready && <img alt="" src={imageUrl} style={{ width: '100%', display: 'block' }} />}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
          />
        </div>
      </div>
    </div>
  );
}
