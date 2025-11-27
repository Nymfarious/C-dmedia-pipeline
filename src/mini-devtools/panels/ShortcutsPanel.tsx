import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, Search, Keyboard } from 'lucide-react';
import { useDevToolsStore } from '../stores/devToolsStore';
import { useMiniDevContext } from '../MiniDevContext';

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Detect Mac vs Windows/Linux
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const commands: ShortcutCommand[] = [
    // Navigation
    { id: 'nav-overview', name: 'Go to Overview', description: 'Open overview panel', keys: [modKey, '1'], category: 'navigation', action: () => setActiveSection('overview') },
    { id: 'nav-logs', name: 'Go to Logs', description: 'Open logs panel', keys: [modKey, 'L'], category: 'navigation', action: () => setActiveSection('logs') },
    { id: 'nav-apis', name: 'Go to APIs', description: 'Open APIs panel', keys: [modKey, 'A'], category: 'navigation', action: () => setActiveSection('apis') },
    { id: 'nav-security', name: 'Go to Security', description: 'Open security panel', keys: [modKey, 'S'], category: 'navigation', action: () => setActiveSection('security') },
    { id: 'nav-pipeline', name: 'Go to Pipeline', description: 'Open pipeline monitor', keys: [modKey, 'P'], category: 'navigation', action: () => setActiveSection('pipeline') },
    
    // Actions
    { id: 'action-close', name: 'Close Drawer', description: 'Close DevTools drawer', keys: ['Esc'], category: 'action', action: closeDrawer },
    { id: 'action-toggle', name: 'Toggle Drawer', description: 'Open/close DevTools', keys: [modKey, 'D'], category: 'action', action: toggleDrawer },
    { id: 'action-palette', name: 'Command Palette', description: 'Open command palette', keys: [modKey, 'K'], category: 'action', action: () => setCommandPaletteOpen(true) },
    
    // Panels
    { id: 'panel-tokens', name: 'UI Tokens', description: 'View design tokens', keys: [modKey, 'T'], category: 'panel', action: () => setActiveSection('tokens') },
    { id: 'panel-flowchart', name: 'Flowchart', description: 'View route flowchart', keys: [modKey, 'F'], category: 'panel', action: () => setActiveSection('flowchart') },
    { id: 'panel-audio', name: 'Audio Controls', description: 'Open audio panel', keys: [modKey, 'U'], category: 'panel', action: () => setActiveSection('audio') },
  ];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      
      // Command palette
      if (mod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Find matching command
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
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    action: filteredCommands.filter(c => c.category === 'action'),
    panel: filteredCommands.filter(c => c.category === 'panel'),
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Keyboard className="h-7 w-7" />
          Keyboard Shortcuts
        </h3>
        <p className="text-slate-400 mt-2">Quick commands for faster navigation</p>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="py-3">
          <div className="flex items-start gap-2 text-sm text-blue-300">
            <Command className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Pro tip:</span> Press{' '}
              <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">{modKey}+K</kbd>{' '}
              to open the command palette anywhere
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-slate-100"
        />
      </div>

      {/* Navigation Shortcuts */}
      {groupedCommands.navigation.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedCommands.navigation.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={cmd.action}
              >
                <div>
                  <div className="text-sm font-medium text-slate-200">{cmd.name}</div>
                  <div className="text-xs text-slate-500">{cmd.description}</div>
                </div>
                <div className="flex gap-1">
                  {cmd.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Shortcuts */}
      {groupedCommands.action.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedCommands.action.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={cmd.action}
              >
                <div>
                  <div className="text-sm font-medium text-slate-200">{cmd.name}</div>
                  <div className="text-xs text-slate-500">{cmd.description}</div>
                </div>
                <div className="flex gap-1">
                  {cmd.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Panel Shortcuts */}
      {groupedCommands.panel.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-base">Panels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedCommands.panel.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={cmd.action}
              >
                <div>
                  <div className="text-sm font-medium text-slate-200">{cmd.name}</div>
                  <div className="text-xs text-slate-500">{cmd.description}</div>
                </div>
                <div className="flex gap-1">
                  {cmd.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Platform Note */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Your platform:</span>
            <Badge variant="outline" className="text-slate-300">
              {isMac ? 'macOS (⌘ Command)' : 'Windows/Linux (Ctrl)'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
