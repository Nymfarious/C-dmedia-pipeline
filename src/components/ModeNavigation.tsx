import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Layers, Layout } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export type AppMode = 'editor' | 'timeline' | 'workspace';

interface ModeNavigationProps {
  className?: string;
}

export function ModeNavigation({ className }: ModeNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getCurrentMode = (): AppMode => {
    if (location.pathname === '/workspace') return 'timeline';
    // Add more routes as needed
    return 'editor';
  };
  
  const currentMode = getCurrentMode();
  
  const handleModeChange = (mode: AppMode) => {
    switch (mode) {
      case 'editor':
        navigate('/');
        break;
      case 'timeline':
        navigate('/workspace');
        break;
      case 'workspace':
        // Future workspace/dashboard route
        navigate('/');
        break;
    }
  };

  return (
    <div className={className}>
      <Tabs value={currentMode} onValueChange={(v) => handleModeChange(v as AppMode)}>
        <TabsList className="bg-secondary/50 border border-border">
          <TabsTrigger 
            value="editor" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger 
            value="workspace" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Layout className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspace</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
