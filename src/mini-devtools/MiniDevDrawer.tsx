import { useEffect } from 'react';
import { X, Eye, Volume2, Film, FileText, Code, Network, Bot, TestTube, Map, Palette, AlertCircle, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDevToolsStore } from './stores/devToolsStore';
import { useDevLogsStore } from './stores/devLogsStore';
import { useMiniDevContext } from './MiniDevContext';
import { useFeatureFlags } from './hooks/useFeatureFlags';

// Import all panels
import { OverviewPanel } from './panels/OverviewPanel';
import { UITokensPanel } from './panels/UITokensPanel';
import { LogsPanel } from './panels/LogsPanel';
import { SecurityPanel } from './panels/SecurityPanel';
import { APIsPanel } from './panels/APIsPanel';
import { PipelineMonitorPanel } from './panels/PipelineMonitorPanel';
import { TextContentPanel } from './panels/TextContentPanel';
import { FlowchartPanel } from './panels/FlowchartPanel';
import { MCPAgentsPanel } from './panels/MCPAgentsPanel';
import { AudioPanel } from './panels/AudioPanel';
import { VideoAnimationPanel } from './panels/VideoAnimationPanel';

const coreSections = [
  { id: 'overview', name: 'Overview', icon: Eye, component: OverviewPanel },
  { id: 'audio', name: 'Audio', icon: Volume2, component: AudioPanel },
  { id: 'video', name: 'Video/Animation', icon: Film, component: VideoAnimationPanel },
  { id: 'text', name: 'Text/Content', icon: FileText, component: TextContentPanel },
  { id: 'libraries', name: 'Libraries', icon: Code, component: null },
  { id: 'apis', name: 'APIs', icon: Network, component: APIsPanel },
  { id: 'mcp', name: 'MCP/Agents', icon: Bot, component: MCPAgentsPanel },
  { id: 'data', name: 'Data & Test', icon: TestTube, component: null },
  { id: 'flowchart', name: 'Flowchart', icon: Map, component: FlowchartPanel },
  { id: 'tokens', name: 'UI Tokens', icon: Palette, component: UITokensPanel },
  { id: 'logs', name: 'Logs', icon: AlertCircle, component: LogsPanel },
  { id: 'security', name: 'Security', icon: Shield, component: SecurityPanel },
  { id: 'pipeline', name: 'Pipeline Monitor', icon: Activity, component: PipelineMonitorPanel },
];

export function MiniDevDrawer() {
  const { config } = useMiniDevContext();
  const { isOpen, activeSection, setActiveSection, closeDrawer } = useDevToolsStore();
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);
  const flags = useFeatureFlags();

  // Merge core sections with custom panels
  const allSections = [
    ...coreSections,
    ...(config.customPanels || []).map(panel => ({
      id: panel.id,
      name: panel.name,
      icon: panel.icon,
      component: panel.component,
    })),
  ];

  // Filter sections based on config and feature flags
  const enabledPanels = flags.devtools_panels || config.panels;
  const sections = enabledPanels
    ? allSections.filter(s => enabledPanels.includes(s.id))
    : allSections;

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
    const section = sections.find((s) => s.id === activeSection);
    
    if (section?.component) {
      const Component = section.component;
      return <Component />;
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-slate-100 capitalize">
          {section?.name || activeSection}
        </h3>
        <p className="text-slate-400 mt-2">Section content will go here</p>
      </div>
    );
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
                <h2 className="text-lg font-semibold text-slate-100">{config.app.name}</h2>
                <Badge 
                  variant="secondary" 
                  className={
                    config.app.environment === 'production' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : config.app.environment === 'staging'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }
                >
                  {config.app.environment}
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
