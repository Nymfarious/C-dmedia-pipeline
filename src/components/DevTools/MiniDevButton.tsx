import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevToolsStore } from '@/store/devToolsStore';
import { useDevLogsStore } from '@/store/devLogsStore';

const isDev = true;

export function MiniDevButton() {
  const toggleDrawer = useDevToolsStore((state) => state.toggleDrawer);
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);

  if (!isDev) return null;

  return (
    <Button
      onClick={toggleDrawer}
      size="icon"
      className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 opacity-60 hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl relative"
    >
      <Wrench className="h-6 w-6 text-slate-100" />
      {hasUnreadErrors && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
}
