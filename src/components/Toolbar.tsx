import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Move, 
  Crop, 
  Brush, 
  Type, 
  Square, 
  Circle, 
  Triangle,
  Eraser,
  Pipette,
  Palette,
  Video
} from 'lucide-react';

export function Toolbar() {
  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-4">
      <div className="flex items-center gap-1">
        {/* Selection Tools */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Move className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Crop className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        {/* Drawing Tools */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Brush className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Eraser className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Type className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        {/* Shape Tools */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Circle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Triangle className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        {/* Color Tools */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Pipette className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Palette className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        {/* Video Generation */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => {
            // Dispatch custom event to open video generation
            window.dispatchEvent(new CustomEvent('openVideoGeneration'));
          }}
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}