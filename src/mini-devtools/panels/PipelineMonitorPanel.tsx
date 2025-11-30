import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Trash2, ChevronDown, Image, Video, Volume2, Wand2, ExternalLink } from 'lucide-react';
import { usePipelineStore, PipelineStep, PipelineEvent, recordPipelineEvent } from '../stores/pipelineStore';
import { AssetLineageDisplay } from '../components/AssetLineageDisplay';
import { PopoutWindow } from '../components/PopoutWindow';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const stepConfig: Record<PipelineStep, { color: string; label: string; category: 'image' | 'video' | 'audio' | 'other' }> = {
  generate_image: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Generate', category: 'image' },
  edit_image: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Edit', category: 'image' },
  remove_bg: { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: 'Remove BG', category: 'image' },
  upscale: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Upscale', category: 'image' },
  animate: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Animate', category: 'video' },
  generate_tts: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'TTS', category: 'audio' },
};

const categoryConfig = {
  image: { label: 'Image Pipelines', icon: Image, color: 'text-blue-400' },
  video: { label: 'Video Pipelines', icon: Video, color: 'text-orange-400' },
  audio: { label: 'Audio Pipelines', icon: Volume2, color: 'text-cyan-400' },
  other: { label: 'Other Pipelines', icon: Wand2, color: 'text-purple-400' },
};

interface AssetLineageSectionProps {
  events: PipelineEvent[];
  assetId: string;
  isExpanded?: boolean;
}

function AssetLineageSection({ events, assetId, isExpanded = false }: AssetLineageSectionProps) {
  const assetEvents = events.filter(e => e.assetId === assetId).reverse();
  
  if (assetEvents.length === 0) return null;

  return (
    <div className="p-3 bg-background/30 rounded-lg">
      <div className="text-xs text-muted-foreground mb-2 font-medium">{assetId}</div>
      <AssetLineageDisplay 
        events={assetEvents} 
        maxPerRow={isExpanded ? 5 : 3}
        isExpanded={isExpanded}
      />
    </div>
  );
}

interface PipelineMonitorContentProps {
  isExpanded?: boolean;
}

function PipelineMonitorContent({ isExpanded = false }: PipelineMonitorContentProps) {
  const { events, clearEvents } = usePipelineStore();
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [openCategories, setOpenCategories] = useState<string[]>(['image', 'video', 'audio']);
  const isMobile = useIsMobile();

  // Generate mock events on mount for demo
  useEffect(() => {
    if (events.length === 0) {
      const mockEvents = [
        { step: 'generate_image' as const, provider: 'gemini-2.5' as const, duration: 2341, success: true, assetId: 'img-001', metadata: { prompt: 'Beautiful sunset over mountains', width: 1024, height: 1024 } },
        { step: 'remove_bg' as const, provider: 'rembg' as const, duration: 1523, success: true, assetId: 'img-001', metadata: { model: 'u2net' } },
        { step: 'upscale' as const, provider: 'esrgan' as const, duration: 3892, success: true, assetId: 'img-001', metadata: { scale: 4 } },
        { step: 'edit_image' as const, provider: 'firefly' as const, duration: 1876, success: false, assetId: 'img-002', metadata: { error: 'Timeout', instruction: 'Add magical sparkles' } },
        { step: 'generate_tts' as const, provider: 'gcp-tts' as const, duration: 892, success: true, assetId: 'audio-001', metadata: { text: 'Once upon a time...', voice: 'en-US-Neural2-F' } },
        { step: 'animate' as const, provider: 'replicate' as const, duration: 8234, success: true, assetId: 'vid-001', metadata: { fps: 24, duration: 3 } },
        { step: 'generate_image' as const, provider: 'firefly' as const, duration: 3100, success: true, assetId: 'img-003', metadata: { prompt: 'Fantasy castle', width: 1024, height: 768 } },
        { step: 'edit_image' as const, provider: 'gemini-2.5' as const, duration: 2200, success: true, assetId: 'img-003', metadata: { instruction: 'Add dragons' } },
      ];

      mockEvents.forEach((event, idx) => {
        setTimeout(() => recordPipelineEvent(event), idx * 100);
      });
    }
  }, []);

  const filteredEvents = stepFilter === 'all' 
    ? events 
    : events.filter(e => e.step === stepFilter);

  const recentEvents = filteredEvents.slice(0, 10);
  const successCount = recentEvents.filter(e => e.success).length;
  const failCount = recentEvents.length - successCount;
  const avgDuration = recentEvents.length > 0
    ? (recentEvents.reduce((sum, e) => sum + e.duration, 0) / recentEvents.length / 1000).toFixed(1)
    : '0.0';

  // Group events by category
  const eventsByCategory = Object.entries(categoryConfig).reduce((acc, [category]) => {
    const categorySteps = Object.entries(stepConfig)
      .filter(([_, config]) => config.category === category)
      .map(([step]) => step);
    
    acc[category] = events.filter(e => categorySteps.includes(e.step));
    return acc;
  }, {} as Record<string, PipelineEvent[]>);

  // Get unique asset IDs grouped by category
  const assetIdsByCategory = Object.entries(eventsByCategory).reduce((acc, [category, categoryEvents]) => {
    const assetIds = [...new Set(categoryEvents.filter(e => e.assetId).map(e => e.assetId!))];
    acc[category] = assetIds;
    return acc;
  }, {} as Record<string, string[]>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Summary Stats */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-foreground text-sm md:text-base">Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center justify-between md:justify-start gap-2 p-2 md:p-0 bg-background/30 md:bg-transparent rounded">
              <span className="text-muted-foreground">Last 10 ops:</span>
              <div>
                <span className="text-green-400">{successCount} success</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="text-red-400">{failCount} failed</span>
              </div>
            </div>
            <div className="hidden md:block h-4 w-px bg-border" />
            <div className="flex items-center justify-between md:justify-start gap-2 p-2 md:p-0 bg-background/30 md:bg-transparent rounded">
              <span className="text-muted-foreground">Avg duration:</span>
              <span className="text-foreground">{avgDuration}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Lineage by Category - Collapsible */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-foreground text-sm md:text-base">Transformation Pipelines</CardTitle>
          <CardDescription className="text-muted-foreground text-xs md:text-sm">
            Asset lineage grouped by type (S-pattern for overflow)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const assetIds = assetIdsByCategory[category] || [];
            const CategoryIcon = config.icon;
            const isOpen = openCategories.includes(category);
            
            if (assetIds.length === 0) return null;

            return (
              <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={`h-4 w-4 ${config.color}`} />
                      <span className="font-medium text-foreground text-sm">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {assetIds.length} asset{assetIds.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {assetIds.map(assetId => (
                    <AssetLineageSection 
                      key={assetId} 
                      events={events} 
                      assetId={assetId}
                      isExpanded={isExpanded}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters & Clear */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <Select value={stepFilter} onValueChange={setStepFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="Filter by step" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-foreground">All Steps</SelectItem>
            {Object.entries(stepConfig).map(([step, config]) => (
              <SelectItem key={step} value={step} className="text-foreground">
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearEvents}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Events
        </Button>
      </div>

      {/* Event List */}
      <div className={`space-y-2 ${isExpanded ? '' : 'max-h-[50vh] md:max-h-none'} overflow-y-auto`}>
        {filteredEvents.length === 0 ? (
          <Card className="bg-secondary/50 border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No pipeline events to display
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredEvents.map((event) => {
              const stepStyle = stepConfig[event.step];
              
              return (
                <AccordionItem
                  key={event.id}
                  value={event.id}
                  className="bg-secondary/50 border border-border rounded-lg px-3 md:px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3 min-h-[48px] touch-manipulation">
                    {isMobile && !isExpanded ? (
                      <div className="flex flex-col items-start gap-2 w-full pr-2">
                        <div className="flex items-center gap-2 w-full">
                          {event.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <Badge className={`${stepStyle.color} text-xs`}>
                            {stepStyle.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{event.provider}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                          <span>{(event.duration / 1000).toFixed(2)}s</span>
                          <span>{format(event.timestamp, 'HH:mm:ss')}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        {event.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        
                        <Badge className={stepStyle.color}>
                          {stepStyle.label}
                        </Badge>
                        
                        <span className="text-sm text-muted-foreground">{event.provider}</span>
                        
                        <div className="flex-1" />
                        
                        <span className="text-sm text-muted-foreground">
                          {(event.duration / 1000).toFixed(2)}s
                        </span>
                        
                        <span className="text-xs text-muted-foreground">
                          {format(event.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="bg-background/50 rounded p-3">
                      <div className="text-xs text-muted-foreground mb-2">Metadata:</div>
                      <pre className="text-xs text-foreground/80 overflow-x-auto max-w-full">
                        {JSON.stringify(event.metadata || {}, null, 2)}
                      </pre>
                      {event.assetId && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Asset ID: {event.assetId}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}

export function PipelineMonitorPanel() {
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg md:text-2xl font-bold text-foreground">Pipeline Monitor</h3>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Track AI generation pipeline operations</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPopoutOpen(true)}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Pop Out
        </Button>
      </div>

      <PipelineMonitorContent />

      {/* Popout Window */}
      <PopoutWindow
        isOpen={isPopoutOpen}
        onClose={() => setIsPopoutOpen(false)}
        title="Pipeline Monitor - Expanded View"
      >
        <PipelineMonitorContent isExpanded />
      </PopoutWindow>
    </div>
  );
}
