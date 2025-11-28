import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevToolsStore } from './stores/devToolsStore';
import { useDevLogsStore } from './stores/devLogsStore';
import { useMiniDevContext } from './MiniDevContext';
import { useFeatureFlags } from './hooks/useFeatureFlags';

export function MiniDevButton() {
  const { config } = useMiniDevContext();
  const toggleDrawer = useDevToolsStore((state) => state.toggleDrawer);
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);
  const flags = useFeatureFlags();

  if (!flags.devtools_enabled) return null;

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
      {hasUnreadErrors && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
      )}
    </Button>
  );
}
