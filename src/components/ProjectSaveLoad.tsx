import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, FolderOpen, Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  saveProject, 
  loadProject, 
  getSavedProjects, 
  deleteProject, 
  exportProjectAsJSON, 
  importProjectFromJSON,
  ProjectData 
} from '@/lib/localStorage';
import useAppStore from '@/store/appStore';

interface ProjectSaveLoadProps {
  currentAsset?: any;
  onProjectLoad?: (assets: Record<string, any>, currentAssetId?: string) => void;
}

export function ProjectSaveLoad({ currentAsset, onProjectLoad }: ProjectSaveLoadProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<Record<string, ProjectData>>({});
  const { assets } = useAppStore();

  useEffect(() => {
    loadSavedProjects();
  }, []);

  const loadSavedProjects = async () => {
    const projects = await getSavedProjects();
    setSavedProjects(projects);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      await saveProject(projectName, assets, currentAsset?.id);
      toast.success('Project saved successfully!');
      setProjectName('');
      setShowSaveDialog(false);
      await loadSavedProjects();
    } catch (error) {
      console.error('Save project error:', error);
      toast.error('Failed to save project');
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const project = await loadProject(projectId);
      if (project) {
        onProjectLoad?.(project.assets, project.currentAssetId);
        toast.success(`Loaded project: ${project.name}`);
        setShowLoadDialog(false);
      }
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('Failed to load project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted');
      await loadSavedProjects();
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleExportProject = async (projectId: string) => {
    try {
      const jsonData = await exportProjectAsJSON(projectId);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Project exported');
    } catch (error) {
      console.error('Export project error:', error);
      toast.error('Failed to export project');
    }
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await importProjectFromJSON(text);
          toast.success('Project imported successfully');
          await loadSavedProjects();
        } catch (error) {
          console.error('Import project error:', error);
          toast.error('Failed to import project');
        }
      }
    };
    input.click();
  };

  const projectList = Object.values(savedProjects).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProject}>
                Save Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Project
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {projectList.length} saved project{projectList.length !== 1 ? 's' : ''}
              </span>
              <Button variant="outline" size="sm" onClick={handleImportProject}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            
            <Separator />
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {projectList.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No saved projects yet
                </div>
              ) : (
                projectList.map((project) => (
                  <Card key={project.id} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(project.assets).length} asset{Object.keys(project.assets).length !== 1 ? 's' : ''}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportProject(project.id)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleLoadProject(project.id)}
                      >
                        Load Project
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}