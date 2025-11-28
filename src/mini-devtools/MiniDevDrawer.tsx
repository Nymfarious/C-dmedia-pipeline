import { useEffect, useRef, useState } from 'react';
import { X, Eye, Volume2, Film, FileText, Code, Network, Bot, TestTube, Map, Palette, AlertCircle, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDevToolsStore } from './stores/devToolsStore';
import { useDevLogsStore } from './stores/devLogsStore';
import { useMiniDevContext } from './MiniDevContext';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import { useIsMobile } from '@/hooks/use-mobile';

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
import { PanelGeneratorPanel } from './panels/PanelGeneratorPanel';
import { StyleGuidePanel } from './panels/StyleGuidePanel';
import { ShortcutsPanel } from './panels/ShortcutsPanel';
import { ExportPanel } from './panels/ExportPanel';

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
  { id: 'generator', name: 'Panel Generator', icon: Code, component: PanelGeneratorPanel },
  { id: 'styleguide', name: 'Style Guide', icon: Palette, component: StyleGuidePanel },
  { id: 'shortcuts', name: 'Shortcuts', icon: Activity, component: ShortcutsPanel },
  { id: 'export', name: 'Export Report', icon: FileText, component: ExportPanel },
];

export function MiniDevDrawer() {
  const { config } = useMiniDevContext();
  const { isOpen, activeSection, setActiveSection, closeDrawer } = useDevToolsStore();
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);
  const flags = useFeatureFlags();
  const isMobile = useIsMobile();
  
  // Swipe-to-close state
  const touchStartX = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Ref for active tab auto-scroll
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

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

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeDrawer]);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (isMobile && isOpen && activeTabRef.current && tabBarRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeSection, isMobile, isOpen]);

  // Swipe-to-close handlers (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isSwiping) return;
    // Allow vertical scrolling to work normally
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - (e.target as HTMLElement).getBoundingClientRect().top);
    
    // If vertical movement is greater, don't interfere
    if (deltaY > Math.abs(deltaX)) {
      setIsSwiping(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !isSwiping) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    
    // Swipe right to close (threshold 50px)
    if (deltaX > 50) {
      closeDrawer();
    }
    setIsSwiping(false);
  };

  if (!isOpen) return null;

  const renderContent = () => {
    const section = sections.find((s) => s.id === activeSection);
    
    if (section?.component) {
      const Component = section.component;
      return <Component />;
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-foreground capitalize">
          {section?.name || activeSection}
        </h3>
        <p className="text-muted-foreground mt-2">Section content will go here</p>
      </div>
    );
  };

  // Mobile horizontal tab bar
  const renderMobileTabBar = () => (
    <div 
      ref={tabBarRef}
      className="md:hidden w-full overflow-x-auto border-b border-border/50 bg-secondary/50"
    >
      <div className="flex gap-1 p-2 min-w-max">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const showRedDot = section.id === 'logs' && hasUnreadErrors;
          
          return (
            <button
              key={section.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => setActiveSection(section.id)}
              className={`w-12 h-12 rounded-md flex items-center justify-center transition-all relative touch-manipulation ${
                isActive
                  ? 'bg-secondary ring-2 ring-primary text-primary'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {showRedDot && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Desktop vertical icon rail
  const renderDesktopIconRail = () => (
    <div className="hidden md:flex w-12 bg-secondary/50 border-r border-border flex-col items-center py-4 gap-2">
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
                      ? 'bg-secondary ring-2 ring-primary text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {showRedDot && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
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
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[420px] max-w-full bg-background/95 backdrop-blur-xl border-l border-border z-50 transition-transform duration-300 overflow-x-hidden safe-area-bottom touch-manipulation ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Mobile: Horizontal tab bar at top */}
          {renderMobileTabBar()}
          
          {/* Desktop: Vertical icon rail on left */}
          {renderDesktopIconRail()}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-14 md:h-16 border-b border-border px-3 md:px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-foreground truncate">{config.app.name}</h2>
                <Badge 
                  variant="secondary" 
                  className={`shrink-0 text-xs ${
                    config.app.environment === 'production' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : config.app.environment === 'staging'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {config.app.environment}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 w-10 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
