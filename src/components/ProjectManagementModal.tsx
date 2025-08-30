import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Save, 
  FolderOpen, 
  Trash2, 
  Download, 
  Upload, 
  AlertCircle,
  Image,
  Video,
  Music
} from 'lucide-react';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';
import { 
  saveProject, 
  getSavedProjects, 
  loadProject, 
  deleteProject, 
  exportProjectAsJSON, 
  importProjectFromJSON,
  ProjectData 
} from '@/lib/localStorage';
import { toast } from 'sonner';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject?: () => void;
  onProjectLoad?: (assets: Record<string, Asset>, currentAssetId?: string) => void;
}

export function ProjectManagementModal({ 
  isOpen, 
  onClose, 
  onNewProject,
  onProjectLoad 
}: ProjectManagementModalProps) {
  const assets = useAppStore((state) => state.assets);
  const canvases = useAppStore((state) => state.canvases);
  const activeCanvas = useAppStore((state) => state.activeCanvas);
  
  const [activeTab, setActiveTab] = useState<'new' | 'save' | 'load'>('new');
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<Record<string, ProjectData>>({});
  const [isLoading, setIsLoading] = useState(false);

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
    if (onNewProject) {
      onNewProject();
      onClose();
      toast.success('Started new project');
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsLoading(true);
    try {
      const currentAssetId = activeCanvas && canvases.find(c => c.id === activeCanvas)?.asset?.id;
      await saveProject(projectName, assets, currentAssetId);
      toast.success(`Project "${projectName}" saved successfully`);
      setProjectName('');
      loadSavedProjects();
      setActiveTab('load');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const project = await loadProject(projectId);
      if (project && onProjectLoad) {
        onProjectLoad(project.assets, project.currentAssetId);
        onClose();
        toast.success(`Project "${project.name}" loaded successfully`);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      toast.success(`Project "${projectName}" deleted`);
      loadSavedProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleExportProject = async (projectId: string, projectName: string) => {
    try {
      const jsonData = await exportProjectAsJSON(projectId);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Project "${projectName}" exported`);
    } catch (error) {
      console.error('Failed to export project:', error);
      toast.error('Failed to export project');
    }
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const projectId = await importProjectFromJSON(text);
        toast.success('Project imported successfully');
        loadSavedProjects();
        
        // Auto-load the imported project
        const project = await loadProject(projectId);
        if (project && onProjectLoad) {
          onProjectLoad(project.assets, project.currentAssetId);
          onClose();
        }
      } catch (error) {
        console.error('Failed to import project:', error);
        toast.error('Failed to import project');
      }
    };
    input.click();
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const currentAssets = Object.values(assets);
  const hasAssets = currentAssets.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Project Management</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'new' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button
            variant={activeTab === 'save' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('save')}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Project
          </Button>
          <Button
            variant={activeTab === 'load' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('load')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Project
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* New Project Tab */}
          {activeTab === 'new' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Starting a new project will clear your current workspace. Make sure to save your current work first!
                </AlertDescription>
              </Alert>

              {hasAssets && (
                <div className="space-y-3">
                  <Label>Current Workspace Summary</Label>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        You have {currentAssets.length} asset{currentAssets.length !== 1 ? 's' : ''} in your current workspace
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentAssets.slice(0, 5).map((asset) => (
                          <Badge key={asset.id} variant="secondary" className="text-xs">
                            {getAssetIcon(asset.type)}
                            <span className="ml-1">{asset.name}</span>
                          </Badge>
                        ))}
                        {currentAssets.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{currentAssets.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <Button 
                onClick={handleNewProject}
                className="w-full"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start New Project
              </Button>
            </div>
          )}

          {/* Save Project Tab */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              {!hasAssets ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No assets to save. Create or generate some content first.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveProject()}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>What will be saved</Label>
                    <Card className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {currentAssets.length} asset{currentAssets.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentAssets.slice(0, 5).map((asset) => (
                            <Badge key={asset.id} variant="secondary" className="text-xs">
                              {getAssetIcon(asset.type)}
                              <span className="ml-1">{asset.name}</span>
                            </Badge>
                          ))}
                          {currentAssets.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{currentAssets.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Button 
                    onClick={handleSaveProject}
                    disabled={!projectName.trim() || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Project'}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Load Project Tab */}
          {activeTab === 'load' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Saved Projects</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportProject}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>

              {Object.keys(savedProjects).length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No saved projects found</div>
                  <div className="text-sm">Save your current work to see it here</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {Object.values(savedProjects)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((project) => (
                      <Card key={project.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{project.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                {Object.keys(project.assets).length} asset{Object.keys(project.assets).length !== 1 ? 's' : ''} • 
                                Updated {new Date(project.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {Object.keys(project.assets).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.values(project.assets).slice(0, 3).map((asset) => (
                                <Badge key={asset.id} variant="outline" className="text-xs">
                                  {getAssetIcon(asset.type)}
                                  <span className="ml-1">{asset.name}</span>
                                </Badge>
                              ))}
                              {Object.keys(project.assets).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{Object.keys(project.assets).length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleLoadProject(project.id)}
                              disabled={isLoading}
                            >
                              <FolderOpen className="h-4 w-4 mr-1" />
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportProject(project.id, project.name)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}