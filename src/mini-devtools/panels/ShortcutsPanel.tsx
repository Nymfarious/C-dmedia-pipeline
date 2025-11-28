import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, Search, Keyboard } from 'lucide-react';
import { useDevToolsStore } from '../stores/devToolsStore';
import { useMiniDevContext } from '../MiniDevContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShortcutCommand {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: 'navigation' | 'action' | 'panel';
  action: () => void;
}

export function ShortcutsPanel() {
  const { config } = useMiniDevContext();
  const { setActiveSection, closeDrawer, toggleDrawer } = useDevToolsStore();
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const commands: ShortcutCommand[] = [
    { id: 'nav-overview', name: 'Go to Overview', description: 'Open overview panel', keys: [modKey, '1'], category: 'navigation', action: () => setActiveSection('overview') },
    { id: 'nav-logs', name: 'Go to Logs', description: 'Open logs panel', keys: [modKey, 'L'], category: 'navigation', action: () => setActiveSection('logs') },
    { id: 'nav-apis', name: 'Go to APIs', description: 'Open APIs panel', keys: [modKey, 'A'], category: 'navigation', action: () => setActiveSection('apis') },
    { id: 'action-close', name: 'Close Drawer', description: 'Close DevTools drawer', keys: ['Esc'], category: 'action', action: closeDrawer },
    { id: 'action-toggle', name: 'Toggle Drawer', description: 'Open/close DevTools', keys: [modKey, 'D'], category: 'action', action: toggleDrawer },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const command = commands.find(cmd => {
        if (cmd.keys[0] === 'Esc') return e.key === 'Escape';
        if (cmd.keys.length === 2 && mod) {
          return e.key.toLowerCase() === cmd.keys[1].toLowerCase();
        }
        return false;
      });
      if (command) {
        e.preventDefault();
        command.action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Keyboard className="h-5 w-5 md:h-7 md:w-7" />
          Keyboard Shortcuts
        </h3>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Quick commands for faster navigation</p>
      </div>

      {!isMobile && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="py-3">
            <div className="flex items-start gap-2 text-xs md:text-sm text-blue-300">
              <Command className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Pro tip:</span> Press{' '}
                <kbd className="px-2 py-1 bg-background rounded text-xs">{modKey}+K</kbd>{' '}
                to open command palette
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background/50 border-border text-foreground"
        />
      </div>

      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">All Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-background/50 hover:bg-secondary/80 cursor-pointer transition-colors touch-manipulation min-h-[44px]"
              onClick={cmd.action}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs md:text-sm font-medium text-foreground">{cmd.name}</div>
                <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                {cmd.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-1.5 md:px-2 py-0.5 md:py-1 bg-background border border-border rounded text-xs text-foreground/80 font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Your platform:</span>
            <Badge variant="outline" className="text-foreground/80 text-xs">
              {isMac ? 'macOS (⌘)' : 'Windows/Linux (Ctrl)'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
