import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, FolderOpen, Undo, Redo, Images, Archive, Wand2, FileText, Bug, MoreHorizontal, HelpCircle, Activity, PanelLeftClose, PanelLeft } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { useState } from 'react';
import { ProjectManagementModal } from './ProjectManagementModal';
import { DebugPanelSummary } from './DebugPanel/DebugPanel';
import { TutorialTrigger } from './TutorialOverlay';

interface HeaderProps {
  activeTab: string;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onGalleryToggle?: () => void;
  onTemplateToggle?: () => void;
  isTemplateMode?: boolean;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
  onTutorialOpen?: () => void;
}

export function Header({ 
  activeTab, 
  undo, 
  redo, 
  canUndo, 
  canRedo, 
  onGalleryToggle, 
  onTemplateToggle, 
  isTemplateMode,
  onSidebarToggle,
  isSidebarCollapsed,
  onTutorialOpen
}: HeaderProps) {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const { assets } = useAppStore();

  const handleNewProject = () => {
    setShowProjectModal(false);
  };

  const handleProjectLoad = (projectData: any) => {
    setShowProjectModal(false);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 lg:px-6">
      {/* Left section - Logo, sidebar toggle, undo/redo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Sidebar toggle */}
        {onSidebarToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSidebarToggle}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {isSidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            </TooltipContent>
          </Tooltip>
        )}
        
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground truncate">
          <span className="hidden sm:inline">AI Media Pipeline</span>
          <span className="sm:hidden">AMP</span>
        </h1>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={undo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={redo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Redo</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Right section - Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Quick Tour - Always visible */}
        {onTutorialOpen && (
          <TutorialTrigger onClick={onTutorialOpen} />
        )}
        
        {/* Primary Actions - Icon only on medium screens */}
        {onGalleryToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8" onClick={onGalleryToggle}>
                <Images className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Gallery</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="lg:hidden">Gallery</TooltipContent>
          </Tooltip>
        )}
        {onTemplateToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isTemplateMode ? "default" : "outline"} 
                size="sm" 
                className="h-8" 
                onClick={onTemplateToggle}
              >
                <FileText className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">{isTemplateMode ? "Exit" : "Templates"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="lg:hidden">
              {isTemplateMode ? "Exit Templates" : "Templates"}
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Secondary Actions - Hidden until xl, shown in dropdown */}
        <div className="hidden xl:flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/assets'}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Assets
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/image-gen-studio'}>
            <Wand2 className="h-4 w-4 mr-2" />
            Studio
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/debug'}>
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setShowProjectModal(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Projects
          </Button>
        </div>

        {/* More dropdown for smaller screens - includes System Health */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* System Health in dropdown */}
            <div className="px-2 py-1.5">
              <DebugPanelSummary compact />
            </div>
            <DropdownMenuSeparator />
            
            {/* Navigation items hidden on smaller screens */}
            <div className="xl:hidden">
              <DropdownMenuItem onClick={() => window.location.href = '/assets'}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Assets ({Object.keys(assets).length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/image-gen-studio'}>
                <Wand2 className="h-4 w-4 mr-2" />
                Studio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/debug'}>
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowProjectModal(true)}>
                <Archive className="h-4 w-4 mr-2" />
                Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
            
            {/* Always show these */}
            <DropdownMenuItem onClick={() => window.location.href = '/workspace'}>
              <Activity className="h-4 w-4 mr-2" />
              Timeline Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ProjectManagementModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={handleNewProject}
        onProjectLoad={handleProjectLoad}
      />
    </header>
  );
}