import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { MaskQualityInfo } from '@/lib/maskProcessor';

interface MaskQualityFeedbackProps {
  quality: MaskQualityInfo;
  className?: string;
}

export function MaskQualityFeedback({ quality, className }: MaskQualityFeedbackProps) {
  const coveragePercentage = Math.round(quality.coverage * 100);
  const areaDisplay = quality.area > 1000 ? `${Math.round(quality.area / 1000)}K` : quality.area.toString();
  
  const getStatusColor = () => {
    if (!quality.isValid) return 'destructive';
    if (quality.warnings.length > 0) return 'secondary';
    return 'default';
  };
  
  const getStatusIcon = () => {
    if (!quality.isValid) return AlertTriangle;
    if (quality.warnings.length > 0) return Info;
    return CheckCircle;
  };
  
  const StatusIcon = getStatusIcon();

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Mask Quality</span>
          </div>
          <Badge variant={getStatusColor()}>
            {quality.isValid ? 'Good' : 'Needs Attention'}
          </Badge>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Coverage</div>
            <div className="font-medium">{coveragePercentage}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Area</div>
            <div className="font-medium">{areaDisplay} pixels</div>
          </div>
        </div>

        {/* Warnings */}
        {quality.warnings.length > 0 && (
          <Alert className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <div className="space-y-1">
                {quality.warnings.map((warning, idx) => (
                  <div key={idx}>• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {quality.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium">
              <TrendingUp className="h-3 w-3" />
              Suggestions
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {quality.suggestions.map((suggestion, idx) => (
                <div key={idx}>• {suggestion}</div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}