import { Button } from '@/components/ui/button';
import { Save, FolderOpen, Undo, Redo, Images, Archive } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { useState } from 'react';
import { ProjectManagementModal } from './ProjectManagementModal';

interface HeaderProps {
  activeTab: string;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onGalleryToggle?: () => void;
}

export function Header({ activeTab, undo, redo, canUndo, canRedo, onGalleryToggle }: HeaderProps) {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const { assets } = useAppStore();

  const handleNewProject = () => {
    // Clear current state and create a new project
    // This would reset the workspace
    setShowProjectModal(false);
  };

  const handleProjectLoad = (projectData: any) => {
    // Handle project loading logic
    setShowProjectModal(false);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">AI Media Pipeline</h1>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo}
            disabled={!canUndo}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo}
            disabled={!canRedo}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {onGalleryToggle && (
          <Button variant="outline" size="sm" className="h-8" onClick={onGalleryToggle}>
            <Images className="h-4 w-4 mr-2" />
            Gallery ({Object.keys(assets).length})
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/assets'}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Assets ({Object.keys(assets).length})
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowProjectModal(true)}>
          <Archive className="h-4 w-4 mr-2" />
          Projects
        </Button>
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