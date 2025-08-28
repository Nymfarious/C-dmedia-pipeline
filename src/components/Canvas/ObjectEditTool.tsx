import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Plus, Undo } from 'lucide-react';

interface ObjectEditToolProps {
  onEditComplete: (params: {
    operation: 'remove-object' | 'add-object';
    instruction: string;
    brushMask?: { x: number; y: number; radius: number }[];
    clickPosition?: { x: number; y: number };
  }) => void;
  imageUrl: string;
  className?: string;
}

export function ObjectEditTool({ onEditComplete, imageUrl, className }: ObjectEditToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([20]);
  const [maskStrokes, setMaskStrokes] = useState<{ x: number; y: number; radius: number }[]>([]);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('remove');
  const [removeInstruction, setRemoveInstruction] = useState('');
  const [addInstruction, setAddInstruction] = useState('');

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

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(canvas, e);
    
    if (activeTab === 'add') {
      setClickPosition(pos);
      // Draw a marker for add position
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawCanvas();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [imageLoaded, activeTab, getMousePos]);

  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (!imageLoaded || activeTab !== 'remove') return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(canvas, e);
    const newStroke = { x: pos.x, y: pos.y, radius: brushSize[0] };
    setMaskStrokes(prev => [...prev, newStroke]);
    
    drawBrushStroke(pos.x, pos.y, brushSize[0]);
  }, [imageLoaded, activeTab, brushSize, getMousePos]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageLoaded || activeTab !== 'remove') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(canvas, e);
    const newStroke = { x: pos.x, y: pos.y, radius: brushSize[0] };
    setMaskStrokes(prev => [...prev, newStroke]);
    
    drawBrushStroke(pos.x, pos.y, brushSize[0]);
  }, [isDrawing, imageLoaded, activeTab, brushSize, getMousePos]);

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

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Redraw mask strokes if in remove mode
      if (activeTab === 'remove') {
        maskStrokes.forEach(stroke => {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.arc(stroke.x, stroke.y, stroke.radius, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
      
      // Redraw click position if in add mode
      if (activeTab === 'add' && clickPosition) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(clickPosition.x, clickPosition.y, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
    };
    img.src = imageUrl;
  }, [imageUrl, maskStrokes, clickPosition, activeTab]);

  const clearAll = useCallback(() => {
    setMaskStrokes([]);
    setClickPosition(null);
    redrawCanvas();
  }, [redrawCanvas]);

  const applyEdit = useCallback(() => {
    if (activeTab === 'remove') {
      if (maskStrokes.length === 0 && !removeInstruction.trim()) return;
      onEditComplete({
        operation: 'remove-object',
        instruction: removeInstruction.trim() || 'Remove the marked objects',
        brushMask: maskStrokes.length > 0 ? maskStrokes : undefined
      });
    } else {
      if (!clickPosition && !addInstruction.trim()) return;
      onEditComplete({
        operation: 'add-object',
        instruction: addInstruction.trim() || 'Add object here',
        clickPosition
      });
    }
  }, [activeTab, maskStrokes, clickPosition, removeInstruction, addInstruction, onEditComplete]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    clearAll();
  }, [clearAll]);

  const canApply = activeTab === 'remove' 
    ? (maskStrokes.length > 0 || removeInstruction.trim())
    : (clickPosition || addInstruction.trim());

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="remove" className="flex items-center gap-2">
            <Eraser className="h-4 w-4" />
            Remove Objects
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Objects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="remove" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remove-instruction">What to remove (optional)</Label>
            <Input
              id="remove-instruction"
              placeholder="e.g., remove the person in red shirt, erase the power lines"
              value={removeInstruction}
              onChange={(e) => setRemoveInstruction(e.target.value)}
            />
          </div>
          
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
          
          <p className="text-sm text-muted-foreground">
            Paint over objects to remove them, or just describe what to remove above.
          </p>
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-instruction">What to add</Label>
            <Input
              id="add-instruction"
              placeholder="e.g., add a red car, place a tree, insert a person walking"
              value={addInstruction}
              onChange={(e) => setAddInstruction(e.target.value)}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Click where you want to add the object, or just describe what to add above.
          </p>
        </TabsContent>
        
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Undo className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" onClick={applyEdit} disabled={!canApply}>
            Apply {activeTab === 'remove' ? 'Removal' : 'Addition'}
          </Button>
        </div>
      </Tabs>
      
      <canvas
        ref={canvasRef}
        className="border rounded-lg cursor-crosshair max-w-full max-h-96 object-contain mt-4"
        onClick={activeTab === 'add' ? handleCanvasClick : undefined}
        onMouseDown={activeTab === 'remove' ? startDrawing : undefined}
        onMouseMove={activeTab === 'remove' ? draw : undefined}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}