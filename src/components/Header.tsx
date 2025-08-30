import { Button } from '@/components/ui/button';
import { Save, FolderOpen, Undo, Redo } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Header({ activeTab, undo, redo, canUndo, canRedo }: HeaderProps) {
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
        <Button variant="outline" size="sm" className="h-8">
          <Save className="h-4 w-4 mr-2" />
          Save Project
        </Button>
        <Button variant="outline" size="sm" className="h-8">
          <FolderOpen className="h-4 w-4 mr-2" />
          Load Project
        </Button>
      </div>
    </header>
  );
}