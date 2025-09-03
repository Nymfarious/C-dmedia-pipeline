import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, RefreshCw, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TemplatePreviewControlsProps {
  showPreview: boolean;
  onTogglePreview: () => void;
  onRefresh: () => void;
  onDownload?: () => void;
  isRendering?: boolean;
  templateName?: string;
  canvasSize?: { width: number; height: number };
}

export const TemplatePreviewControls: React.FC<TemplatePreviewControlsProps> = ({
  showPreview,
  onTogglePreview,
  onRefresh,
  onDownload,
  isRendering = false,
  templateName,
  canvasSize
}) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview</span>
            {templateName && (
              <Badge variant="outline" className="text-xs">
                {templateName}
              </Badge>
            )}
            {canvasSize && (
              <Badge variant="secondary" className="text-xs">
                {canvasSize.width} × {canvasSize.height}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePreview}
              className="h-8 w-8 p-0"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRendering}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRendering ? 'animate-spin' : ''}`} />
            </Button>
            
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                disabled={isRendering}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};