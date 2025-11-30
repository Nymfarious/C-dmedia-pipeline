import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowDown, CornerDownRight } from 'lucide-react';
import { PipelineEvent, PipelineStep } from '../stores/pipelineStore';

const stepConfig: Record<PipelineStep, { color: string; label: string }> = {
  generate_image: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Generate' },
  edit_image: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Edit' },
  remove_bg: { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: 'Remove BG' },
  upscale: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Upscale' },
  animate: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Animate' },
  generate_tts: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'TTS' },
};

interface AssetLineageDisplayProps {
  events: PipelineEvent[];
  maxPerRow?: number;
  isExpanded?: boolean;
}

export function AssetLineageDisplay({ events, maxPerRow = 3, isExpanded = false }: AssetLineageDisplayProps) {
  const effectiveMaxPerRow = isExpanded ? 5 : maxPerRow;
  
  if (events.length === 0) return null;

  // If items fit in one row, display normally
  if (events.length <= effectiveMaxPerRow) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {events.map((event, idx) => (
          <div key={event.id} className="flex items-center gap-2">
            <LineageNode event={event} />
            {idx < events.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // S-shape pattern for overflow
  const rows: PipelineEvent[][] = [];
  for (let i = 0; i < events.length; i += effectiveMaxPerRow) {
    const row = events.slice(i, i + effectiveMaxPerRow);
    // Reverse every odd row for S-pattern
    if (rows.length % 2 === 1) {
      row.reverse();
    }
    rows.push(row);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, rowIdx) => {
        const isReversedRow = rowIdx % 2 === 1;
        const isLastRow = rowIdx === rows.length - 1;
        
        return (
          <div key={rowIdx} className="relative">
            {/* Row items */}
            <div className={`flex items-center gap-2 ${isReversedRow ? 'flex-row-reverse' : ''}`}>
              {row.map((event, idx) => {
                const isLastInRow = idx === row.length - 1;
                const showArrow = !isLastInRow || !isLastRow;
                const isEndOfRow = isLastInRow && !isLastRow;
                
                return (
                  <div key={event.id} className="flex items-center gap-2">
                    <LineageNode event={event} />
                    {showArrow && !isEndOfRow && (
                      <ArrowRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${isReversedRow ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* S-turn connector to next row */}
            {!isLastRow && (
              <div className={`flex ${isReversedRow ? 'justify-start pl-4' : 'justify-end pr-4'} py-1`}>
                <CornerDownRight className={`h-4 w-4 text-muted-foreground ${isReversedRow ? '-scale-x-100' : ''}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LineageNode({ event }: { event: PipelineEvent }) {
  const stepStyle = stepConfig[event.step];
  
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <Badge className={`${stepStyle.color} text-xs`}>
        {stepStyle.label}
      </Badge>
      <span className="text-xs text-muted-foreground">{event.provider}</span>
    </div>
  );
}
