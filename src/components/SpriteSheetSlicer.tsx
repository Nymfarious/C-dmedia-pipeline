import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Grid3X3, 
  Scissors, 
  Upload, 
  Check, 
  X, 
  Loader2,
  Download,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';
import { 
  sliceSpriteSheet, 
  GRID_OPTIONS, 
  SpliceGrid, 
  SliceResult,
  getGridPreview,
  parseGrid
} from '@/utils/spriteSheetSlicer';
import { cn } from '@/lib/utils';

interface SpriteSheetSlicerProps {
  onClose?: () => void;
  className?: string;
}

export function SpriteSheetSlicer({ onClose, className }: SpriteSheetSlicerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedGrid, setSelectedGrid] = useState<SpliceGrid>('2x2');
  const [isSlicing, setIsSlicing] = useState(false);
  const [slicedResults, setSlicedResults] = useState<SliceResult[]>([]);
  const [selectedSlices, setSelectedSlices] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAssets } = useAppStore();

  // Load image dimensions when selected
  useEffect(() => {
    if (!selectedImage) {
      setImageDimensions(null);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = selectedImage;
  }, [selectedImage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setSlicedResults([]);
    setSelectedSlices(new Set());
  }, []);

  const handleSlice = useCallback(async () => {
    if (!selectedImage) return;
    
    setIsSlicing(true);
    try {
      const results = await sliceSpriteSheet({
        grid: selectedGrid,
        sourceImage: selectedImage,
      });
      
      setSlicedResults(results);
      setSelectedSlices(new Set(results.map(r => r.id))); // Select all by default
      toast.success(`Sliced into ${results.length} images`);
    } catch (error) {
      console.error('Slicing error:', error);
      toast.error('Failed to slice sprite sheet');
    } finally {
      setIsSlicing(false);
    }
  }, [selectedImage, selectedGrid]);

  const toggleSliceSelection = (id: string) => {
    setSelectedSlices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllSlices = () => {
    setSelectedSlices(new Set(slicedResults.map(r => r.id)));
  };

  const deselectAllSlices = () => {
    setSelectedSlices(new Set());
  };

  const addToLibrary = useCallback(() => {
    const selectedResults = slicedResults.filter(r => selectedSlices.has(r.id));
    
    if (selectedResults.length === 0) {
      toast.warning('No slices selected');
      return;
    }
    
    const assets: Asset[] = selectedResults.map((result, index) => ({
      id: `sprite-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'image' as const,
      name: result.name,
      src: result.dataUrl,
      meta: {
        width: result.width,
        height: result.height,
        sourceType: 'sprite-slice',
        row: result.row,
        col: result.col,
        grid: selectedGrid,
      },
      createdAt: Date.now(),
      category: 'uploaded',
      subcategory: 'Sprite Frames',
    }));
    
    addAssets(assets);
    toast.success(`Added ${assets.length} frames to library`);
    
    // Reset state
    setSlicedResults([]);
    setSelectedSlices(new Set());
    setSelectedImage(null);
    
    if (onClose) onClose();
  }, [slicedResults, selectedSlices, selectedGrid, addAssets, onClose]);

  // Grid preview cells
  const gridCells = imageDimensions 
    ? getGridPreview(imageDimensions.width, imageDimensions.height, selectedGrid)
    : [];
  const { rows, cols } = parseGrid(selectedGrid);

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Sprite Sheet Slicer</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Selection */}
        {!selectedImage ? (
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to upload a sprite sheet
            </p>
            <p className="text-xs text-muted-foreground/70">
              PNG, JPG, or WebP supported
            </p>
          </div>
        ) : (
          <>
            {/* Preview with Grid Overlay */}
            <div className="relative rounded-lg overflow-hidden bg-muted/50">
              <div className="relative inline-block w-full">
                <img 
                  src={selectedImage} 
                  alt="Sprite sheet" 
                  className="w-full h-auto max-h-64 object-contain"
                />
                {/* Grid overlay */}
                {imageDimensions && (
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {gridCells.map((cell, i) => (
                      <rect
                        key={i}
                        x={cell.x}
                        y={cell.y}
                        width={cell.width}
                        height={cell.height}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="8 4"
                        opacity="0.8"
                      />
                    ))}
                  </svg>
                )}
              </div>
              
              {/* Dimensions badge */}
              {imageDimensions && (
                <Badge className="absolute top-2 right-2 bg-background/80 text-foreground">
                  {imageDimensions.width} × {imageDimensions.height}
                </Badge>
              )}
              
              {/* Change image button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
            </div>
            
            {/* Grid Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select Grid Layout
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRID_OPTIONS.map((option) => (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedGrid === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGrid(option.value)}
                        className="flex flex-col h-12 text-xs"
                      >
                        <Grid3X3 className="h-4 w-4 mb-1" />
                        {option.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {option.cells} frames
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Will create {rows * cols} individual frames
              </p>
            </div>
            
            {/* Slice Button */}
            <Button
              className="w-full"
              onClick={handleSlice}
              disabled={isSlicing}
            >
              {isSlicing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Slicing...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4 mr-2" />
                  Slice Sprite Sheet
                </>
              )}
            </Button>
          </>
        )}
        
        {/* Sliced Results */}
        {slicedResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Sliced Frames ({selectedSlices.size}/{slicedResults.length} selected)
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={selectAllSlices}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllSlices}>
                  None
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-40">
              <div className="grid grid-cols-4 gap-2">
                {slicedResults.map((result) => (
                  <div
                    key={result.id}
                    className={cn(
                      "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors",
                      selectedSlices.has(result.id)
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={() => toggleSliceSelection(result.id)}
                  >
                    <img 
                      src={result.dataUrl} 
                      alt={result.name}
                      className="w-full aspect-square object-cover"
                    />
                    {selectedSlices.has(result.id) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5">
                      <p className="text-xs text-center truncate">{result.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Add to Library */}
            <Button
              className="w-full"
              onClick={addToLibrary}
              disabled={selectedSlices.size === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {selectedSlices.size} Frames to Library
            </Button>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
