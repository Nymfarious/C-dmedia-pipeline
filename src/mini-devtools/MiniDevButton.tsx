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
  
  const positionClasses = {
    'bottom-right': 'right-6 bottom-6',
    'bottom-left': 'left-6 bottom-6',
    'top-right': 'right-6 top-6',
    'top-left': 'left-6 top-6',
  };

  return (
    <Button
      onClick={toggleDrawer}
      size="icon"
      className={`fixed ${positionClasses[position]} z-50 h-14 w-14 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 opacity-60 hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl relative`}
    >
      <Wrench className="h-6 w-6 text-slate-100" />
      {hasUnreadErrors && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
}
