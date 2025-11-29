import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevToolsStore } from './stores/devToolsStore';
import { useDevLogsStore } from './stores/devLogsStore';
import { useMiniDevContext } from './MiniDevContext';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { cn } from '@/lib/utils';

export function MiniDevButton() {
  const { config } = useMiniDevContext();
  const toggleDrawer = useDevToolsStore((state) => state.toggleDrawer);
  const logs = useDevLogsStore((state) => state.logs);
  const flags = useFeatureFlags();

  if (!flags.devtools_enabled) return null;

  // Calculate severity-based dot count (1-3 scale)
  const unreadErrors = logs.filter(l => !l.read && l.level === 'error').length;
  const unreadWarns = logs.filter(l => !l.read && l.level === 'warn').length;
  
  // 3 dots for critical (3+ errors), 2 dots for moderate (1-2 errors), 1 dot for warnings
  const dotCount = unreadErrors >= 3 ? 3 : unreadErrors >= 1 ? 2 : unreadWarns > 0 ? 1 : 0;

  const position = config.position || flags.devtools_position || 'bottom-right';
  
  // Mobile-adjusted positions (bottom-20 clears typical mobile nav bars)
  const positionClasses = {
    'bottom-right': 'right-4 md:right-6 bottom-20 md:bottom-6',
    'bottom-left': 'left-4 md:left-6 bottom-20 md:bottom-6',
    'top-right': 'right-4 md:right-6 top-20 md:top-6',
    'top-left': 'left-4 md:left-6 top-20 md:top-6',
  };

  return (
    <Button
      onClick={toggleDrawer}
      size="icon"
      className={`fixed ${positionClasses[position]} z-50 h-12 w-12 md:h-14 md:w-14 rounded-full bg-secondary/80 backdrop-blur-md border border-border opacity-60 hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl relative touch-manipulation safe-area-bottom`}
    >
      <Wrench className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
      {dotCount > 0 && (
        <span className="absolute -top-1 -right-1 flex gap-0.5">
          {Array.from({ length: dotCount }, (_, i) => (
            <span 
              key={i} 
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                unreadErrors > 0 ? "bg-destructive" : "bg-amber-500"
              )} 
            />
          ))}
        </span>
      )}
    </Button>
  );
}
