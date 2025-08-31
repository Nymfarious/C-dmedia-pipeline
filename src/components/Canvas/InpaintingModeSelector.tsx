import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Replace, Trash2, Sparkles, RefreshCw } from 'lucide-react';

type InpaintMode = 'remove' | 'add' | 'replace';

interface InpaintingModeSelectorProps {
  mode: InpaintMode;
  onModeChange: (mode: InpaintMode) => void;
  className?: string;
}

interface ModeConfig {
  key: InpaintMode;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string[];
  color: 'destructive' | 'default' | 'secondary';
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    key: 'remove',
    title: 'Remove Object',
    subtitle: 'Clean Background',
    icon: Trash2,
    description: 'Completely remove painted objects and fill with natural background',
    examples: ['Remove person', 'Delete car', 'Erase text'],
    color: 'destructive'
  },
  {
    key: 'add',
    title: 'Add New Object',
    subtitle: 'Insert Something',
    icon: Sparkles,
    description: 'Add new objects that blend naturally into the scene',
    examples: ['Add cat', 'Place tree', 'Insert car'],
    color: 'default'
  },
  {
    key: 'replace',
    title: 'Replace Object',
    subtitle: 'Swap with Another',
    icon: RefreshCw,
    description: 'Replace painted objects with something entirely new',
    examples: ['Change to dog', 'Turn into flower', 'Replace with car'],
    color: 'secondary'
  }
];

export function InpaintingModeSelector({ mode, onModeChange, className }: InpaintingModeSelectorProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${className}`}>
      {MODE_CONFIGS.map((config) => {
        const Icon = config.icon;
        const isSelected = mode === config.key;
        
        return (
          <Card 
            key={config.key}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected 
                ? 'ring-2 ring-primary shadow-md' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onModeChange(config.key)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{config.title}</div>
                      <div className="text-xs text-muted-foreground">{config.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {config.description}
                </div>

                {/* Examples */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Examples:</div>
                  <div className="flex flex-wrap gap-1">
                    {config.examples.map((example, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs px-2 py-0.5"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}