import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Image, 
  Video, 
  Music, 
  FileText,
  Calendar,
  Package,
  AlertTriangle
} from 'lucide-react';
import { Asset } from '@/types/media';
import { useAppStore } from '@/store/appStore';
import { 
  saveProject, 
  getSavedProjects, 
  deleteProject, 
  exportProjectAsJSON, 
  importProjectFromJSON 
} from '@/lib/localStorage';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onProjectLoad: (assets: Record<string, Asset>, currentAssetId?: string) => void;
}

interface ProjectData {
  id: string;
  name: string;
  assets: Record<string, Asset>;
  currentAssetId?: string;
  createdAt: number;
  updatedAt: number;
}

export function ProjectManagementModal({ 
  isOpen, 
  onClose, 
  onNewProject, 
  onProjectLoad 
}: ProjectManagementModalProps) {
  const { assets, clearWorkspace } = useAppStore();
  const [activeTab, setActiveTab] = useState('new');
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<Record<string, ProjectData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load saved projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedProjects();
    }
  }, [isOpen]);

  const loadSavedProjects = async () => {
    try {
      const projects = await getSavedProjects();
      setSavedProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load saved projects');
    }
  };

  const handleNewProject = () => {
    clearWorkspace();
    onNewProject();
    onClose();
    toast.success('New project created');
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const assetCount = Object.keys(assets).length;
    if (assetCount === 0) {
      toast.error('No assets to save');
      return;
    }

    setIsLoading(true);
    try {
      const projectId = await saveProject(projectName.trim(), assets);
      await loadSavedProjects();
      setProjectName('');
      toast.success(`Project "${projectName}" saved with ${assetCount} assets`);
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    const project = savedProjects[projectId];
    if (!project) return;

    setIsLoading(true);
    try {
      onProjectLoad(project.assets, project.currentAssetId);
      onClose();
      const assetCount = Object.keys(project.assets).length;
      toast.success(`Project "${project.name}" loaded with ${assetCount} assets`);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      await loadSavedProjects();
      setDeleteConfirm(null);
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleExportProject = async (projectId: string) => {
    try {
      const project = savedProjects[projectId];
      const jsonData = await exportProjectAsJSON(projectId);
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.lovable-project.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Project exported');
    } catch (error) {
      console.error('Failed to export project:', error);
      toast.error('Failed to export project');
    }
  };

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const projectId = await importProjectFromJSON(text);
      await loadSavedProjects();
      toast.success('Project imported successfully');
    } catch (error) {
      console.error('Failed to import project:', error);
      toast.error('Failed to import project');
    }
    
    // Reset input
    event.target.value = '';
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectSummary = (assets: Record<string, Asset>) => {
    const types = Object.values(assets).reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types).map(([type, count]) => (
      <Badge key={type} variant="secondary" className="text-xs">
        {getAssetIcon(type)}
        <span className="ml-1">{count}</span>
      </Badge>
    ));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Project Management
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </TabsTrigger>
              <TabsTrigger value="save" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Project
              </TabsTrigger>
              <TabsTrigger value="load" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Load Project
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Project</CardTitle>
                  <CardDescription>
                    Start fresh with a new empty project. This will clear your current workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800 dark:text-amber-200">
                      This will clear all current assets and start fresh
                    </span>
                  </div>
                  <Button onClick={handleNewProject} className="w-full" size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="save" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Save Current Project</CardTitle>
                  <CardDescription>
                    Save your current workspace with all assets and progress.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveProject()}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Current assets: {Object.keys(assets).length}
                  </div>

                  {Object.keys(assets).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getProjectSummary(assets)}
                    </div>
                  )}

                  <Button 
                    onClick={handleSaveProject} 
                    disabled={!projectName.trim() || Object.keys(assets).length === 0 || isLoading}
                    className="w-full" 
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Project'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Projects</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportProject}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadSavedProjects}>
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.keys(savedProjects).length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center space-y-2">
                        <Package className="h-8 w-8 mx-auto opacity-50" />
                        <p>No saved projects found</p>
                        <p className="text-sm">Create and save your first project to see it here</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  Object.values(savedProjects)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((project) => (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{project.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3" />
                                Created: {formatDate(project.createdAt)}
                                {project.updatedAt !== project.createdAt && (
                                  <span>• Updated: {formatDate(project.updatedAt)}</span>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportProject(project.id)}
                                title="Export project"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(project.id)}
                                title="Delete project"
                                className="hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {getProjectSummary(project.assets)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total assets: {Object.keys(project.assets).length}
                            </div>
                            <Separator />
                            <Button 
                              onClick={() => handleLoadProject(project.id)}
                              disabled={isLoading}
                              className="w-full"
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Load Project
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm ? savedProjects[deleteConfirm]?.name : ''}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDeleteProject(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}