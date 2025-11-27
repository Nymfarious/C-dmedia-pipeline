import { useEffect } from 'react';
import { X, Eye, Volume2, Film, FileText, Code, Network, Bot, TestTube, Map, Palette, AlertCircle, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDevToolsStore } from '@/store/devToolsStore';
import { useDevLogsStore } from '@/store/devLogsStore';
import { OverviewPanel } from './OverviewPanel';
import { UITokensPanel } from './UITokensPanel';
import { LogsPanel } from './LogsPanel';

const sections = [
  { id: 'overview', name: 'Overview', icon: Eye },
  { id: 'audio', name: 'Audio', icon: Volume2 },
  { id: 'video', name: 'Video/Animation', icon: Film },
  { id: 'text', name: 'Text/Content', icon: FileText },
  { id: 'libraries', name: 'Libraries', icon: Code },
  { id: 'apis', name: 'APIs', icon: Network },
  { id: 'mcp', name: 'MCP/Agents', icon: Bot },
  { id: 'data', name: 'Data & Test', icon: TestTube },
  { id: 'flowchart', name: 'Flowchart', icon: Map },
  { id: 'tokens', name: 'UI Tokens', icon: Palette },
  { id: 'logs', name: 'Logs', icon: AlertCircle },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'pipeline', name: 'Pipeline Monitor', icon: Activity },
];

export function MiniDevDrawer() {
  const { isOpen, activeSection, setActiveSection, closeDrawer } = useDevToolsStore();
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPanel />;
      case 'tokens':
        return <UITokensPanel />;
      case 'logs':
        return <LogsPanel />;
      default:
        return (
          <div>
            <h3 className="text-2xl font-bold text-slate-100 capitalize">
              {sections.find((s) => s.id === activeSection)?.name || activeSection}
            </h3>
            <p className="text-slate-400 mt-2">Section content will go here</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full">
          {/* Icon Rail */}
          <div className="w-12 bg-slate-800/50 border-r border-slate-700 flex flex-col items-center py-4 gap-2">
            <TooltipProvider delayDuration={200}>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const showRedDot = section.id === 'logs' && hasUnreadErrors;
                
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all relative ${
                          isActive
                            ? 'bg-slate-700 ring-2 ring-blue-500 text-blue-400'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {showRedDot && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{section.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-700 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Storybook</h2>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  dev
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
