import { useEffect, useRef, useState, Suspense, useTransition } from 'react';
import { X, Eye, Volume2, Film, FileText, Code, Network, Bot, TestTube, Map, Palette, AlertCircle, Shield, Activity, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

// Loading skeleton for panel content
function PanelLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg mt-4" />
    </div>
  );
}

export function MiniDevDrawer() {
  const { config } = useMiniDevContext();
  const { isOpen, activeSection, setActiveSection, closeDrawer } = useDevToolsStore();
  const hasUnreadErrors = useDevLogsStore((state) => state.hasUnreadErrors);
  const flags = useFeatureFlags();
  const isMobile = useIsMobile();
  
  // Transition for smoother panel switching
  const [isPending, startTransition] = useTransition();
  
  // Swipe-to-close state
  const touchStartX = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Ref for active tab auto-scroll
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  
  // Handle section change with transition
  const handleSectionChange = (sectionId: string) => {
    startTransition(() => {
      setActiveSection(sectionId);
    });
  };

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
    // Show loading skeleton during transition
    if (isPending) {
      return <PanelLoadingSkeleton />;
    }
    
    const section = sections.find((s) => s.id === activeSection);
    
    if (section?.component) {
      const Component = section.component;
      return (
        <Suspense fallback={<PanelLoadingSkeleton />}>
          <Component />
        </Suspense>
      );
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
      role="tablist"
      aria-label="DevTools sections"
      className="md:hidden w-full overflow-x-auto border-b border-border/50 bg-secondary/30 backdrop-blur-sm"
    >
      <div className="flex gap-1.5 p-2 min-w-max">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const showRedDot = section.id === 'logs' && hasUnreadErrors;
          
          return (
            <button
              key={section.id}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              aria-label={section.name}
              onClick={() => handleSectionChange(section.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 relative touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                isActive
                  ? 'bg-primary/10 text-primary border-b-2 border-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground active:scale-95'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              {showRedDot && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" aria-label="Has unread errors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Desktop vertical icon rail
  const renderDesktopIconRail = () => (
    <nav 
      role="tablist" 
      aria-label="DevTools sections"
      className="hidden md:flex w-12 bg-secondary/30 border-r border-border/50 flex-col items-center py-4 gap-2"
    >
      <TooltipProvider delayDuration={200}>
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const showRedDot = section.id === 'logs' && hasUnreadErrors;
          
          return (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <button
                  role="tab"
                  aria-selected={isActive}
                  aria-label={section.name}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {showRedDot && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" aria-label="Has unread errors" />
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
    </nav>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Developer Tools"
        className={`fixed right-0 top-0 h-full w-full md:w-[420px] max-w-full bg-background/98 backdrop-blur-xl border-l border-border/50 z-50 overflow-x-hidden safe-area-bottom touch-manipulation shadow-2xl transition-all duration-200 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
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
            <div className="h-14 md:h-16 border-b border-border/50 px-3 md:px-4 flex items-center justify-between shrink-0 bg-background/50">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-foreground truncate">{config.app.name}</h2>
                <Badge 
                  variant="secondary" 
                  className={`shrink-0 text-xs transition-colors ${
                    config.app.environment === 'production' 
                      ? 'bg-green-500/20 text-green-500 border-green-500/30 dark:text-green-400'
                      : config.app.environment === 'staging'
                      ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400'
                      : 'bg-blue-500/20 text-blue-600 border-blue-500/30 dark:text-blue-400'
                  }`}
                >
                  {config.app.environment}
                </Badge>
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                aria-label="Close developer tools"
                className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive h-10 w-10 md:h-8 md:w-8 rounded-full touch-manipulation transition-colors duration-200"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
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
