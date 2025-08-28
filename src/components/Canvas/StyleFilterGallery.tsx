import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Film, Palette, Clock, Contrast } from 'lucide-react';

interface StyleFilterGalleryProps {
  onStyleApply: (style: string) => void;
  className?: string;
}

export function StyleFilterGallery({ onStyleApply, className }: StyleFilterGalleryProps) {
  const stylePresets = [
    {
      id: 'film',
      name: 'Film',
      icon: Film,
      description: 'Vintage film look',
      preview: 'bg-gradient-to-br from-amber-100 to-orange-200'
    },
    {
      id: 'pop-art',
      name: 'Pop Art',
      icon: Palette,
      description: 'Bold, vibrant colors',
      preview: 'bg-gradient-to-br from-pink-200 to-purple-300'
    },
    {
      id: 'vintage',
      name: 'Vintage',
      icon: Clock,
      description: 'Aged, nostalgic feel',
      preview: 'bg-gradient-to-br from-amber-200 to-yellow-300'
    },
    {
      id: 'black-white',
      name: 'B&W',
      icon: Contrast,
      description: 'Classic black & white',
      preview: 'bg-gradient-to-br from-gray-200 to-gray-400'
    },
    {
      id: 'vivid',
      name: 'Vivid',
      icon: Palette,
      description: 'Enhanced saturation',
      preview: 'bg-gradient-to-br from-blue-200 to-green-300'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Style Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stylePresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
              onClick={() => onStyleApply(preset.id)}
            >
              <div className={`w-12 h-8 rounded ${preset.preview} border`} />
              <div className="text-center">
                <div className="text-xs font-medium">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.description}</div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-2 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground text-center">
            Click any style to apply it to your image
          </div>
        </div>
      </CardContent>
    </Card>
  );
}