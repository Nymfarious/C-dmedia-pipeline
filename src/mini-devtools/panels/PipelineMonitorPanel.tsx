import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle, Trash2, ArrowRight } from 'lucide-react';
import { usePipelineStore, PipelineStep, recordPipelineEvent } from '../stores/pipelineStore';
import { format } from 'date-fns';

const stepConfig: Record<PipelineStep, { color: string; label: string }> = {
  generate_image: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Generate' },
  edit_image: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Edit' },
  remove_bg: { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: 'Remove BG' },
  upscale: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Upscale' },
  animate: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Animate' },
  generate_tts: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'TTS' },
};

export function PipelineMonitorPanel() {
  const { events, clearEvents } = usePipelineStore();
  const [stepFilter, setStepFilter] = useState<string>('all');

  // Generate mock events on mount for demo
  useEffect(() => {
    if (events.length === 0) {
      const mockEvents = [
        { step: 'generate_image' as const, provider: 'gemini-2.5' as const, duration: 2341, success: true, assetId: 'img-001', metadata: { prompt: 'Beautiful sunset over mountains', width: 1024, height: 1024 } },
        { step: 'remove_bg' as const, provider: 'rembg' as const, duration: 1523, success: true, assetId: 'img-001', metadata: { model: 'u2net' } },
        { step: 'upscale' as const, provider: 'esrgan' as const, duration: 3892, success: true, assetId: 'img-001', metadata: { scale: 4 } },
        { step: 'edit_image' as const, provider: 'firefly' as const, duration: 1876, success: false, assetId: 'img-002', metadata: { error: 'Timeout', instruction: 'Add magical sparkles' } },
        { step: 'generate_tts' as const, provider: 'gcp-tts' as const, duration: 892, success: true, metadata: { text: 'Once upon a time...', voice: 'en-US-Neural2-F' } },
        { step: 'animate' as const, provider: 'replicate' as const, duration: 8234, success: true, assetId: 'img-001', metadata: { fps: 24, duration: 3 } },
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

  // Asset lineage example - group events by assetId
  const assetLineage = events
    .filter(e => e.assetId === 'img-001')
    .reverse()
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">Pipeline Monitor</h3>
        <p className="text-slate-400 mt-2">Track AI generation pipeline operations</p>
      </div>

      {/* Summary Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-base">Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-slate-400">Last 10 ops:</span>
              <span className="ml-2 text-green-400">{successCount} success</span>
              <span className="mx-1 text-slate-600">/</span>
              <span className="text-red-400">{failCount} failed</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400">Avg duration:</span>
              <span className="ml-2 text-slate-200">{avgDuration}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Lineage */}
      {assetLineage.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-100 text-base">Asset Lineage (img-001)</CardTitle>
            <CardDescription className="text-slate-400">Transformation pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {assetLineage.map((event, idx) => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className={stepConfig[event.step].color}>
                      {stepConfig[event.step].label}
                    </Badge>
                    <span className="text-xs text-slate-500">{event.provider}</span>
                  </div>
                  {idx < assetLineage.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Clear */}
      <div className="flex items-center justify-between gap-3">
        <Select value={stepFilter} onValueChange={setStepFilter}>
          <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700 text-slate-200">
            <SelectValue placeholder="Filter by step" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-200">All Steps</SelectItem>
            {Object.entries(stepConfig).map(([step, config]) => (
              <SelectItem key={step} value={step} className="text-slate-200">
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearEvents}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Events
        </Button>
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
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
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 w-full">
                      {event.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      
                      <Badge className={stepStyle.color}>
                        {stepStyle.label}
                      </Badge>
                      
                      <span className="text-sm text-slate-400">{event.provider}</span>
                      
                      <div className="flex-1" />
                      
                      <span className="text-sm text-slate-500">
                        {(event.duration / 1000).toFixed(2)}s
                      </span>
                      
                      <span className="text-xs text-slate-500">
                        {format(event.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3">
                    <div className="bg-slate-900/50 rounded p-3">
                      <div className="text-xs text-slate-400 mb-2">Metadata:</div>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(event.metadata || {}, null, 2)}
                      </pre>
                      {event.assetId && (
                        <div className="mt-2 text-xs text-slate-500">
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
