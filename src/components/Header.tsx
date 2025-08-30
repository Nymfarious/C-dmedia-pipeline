import { Button } from '@/components/ui/button';
import { Save, FolderOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-foreground">AI Media Pipeline</h1>
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