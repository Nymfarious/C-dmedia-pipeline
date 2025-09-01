import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, HardDrive, Database, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { analyzeAssets } from '@/utils/assetMigration';
import { toast } from 'sonner';

interface StorageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageManagementModal({ isOpen, onClose }: StorageManagementModalProps) {
  const { 
    assets, 
    canvases, 
    steps, 
    cleanupOldCanvases, 
    optimizeStorage, 
    getStorageUsage,
    clearWorkspace 
  } = useAppStore();
  
  const [storageUsage, setStorageUsage] = useState<{ canvases: number; assets: number; steps: number } | null>(null);
  const [assetAnalysis, setAssetAnalysis] = useState<ReturnType<typeof analyzeAssets> | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStorageStats();
    }
  }, [isOpen, assets, canvases, steps]);

  const loadStorageStats = async () => {
    const usage = await getStorageUsage();
    setStorageUsage(usage);
    
    const assetsArray = Object.values(assets);
    if (assetsArray.length > 0) {
      const analysis = analyzeAssets(assetsArray);
      setAssetAnalysis(analysis);
    }
  };

  const handleOptimizeStorage = async () => {
    setIsOptimizing(true);
    try {
      await optimizeStorage();
      await loadStorageStats();
      toast.success('Storage optimized successfully!');
    } catch (error) {
      toast.error('Failed to optimize storage');
      console.error('Storage optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCleanupCanvases = () => {
    setIsCleaning(true);
    try {
      cleanupOldCanvases();
      loadStorageStats();
      toast.success('Old canvases cleaned up!');
    } catch (error) {
      toast.error('Failed to cleanup canvases');
      console.error('Canvas cleanup failed:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearWorkspace = () => {
    clearWorkspace();
    onClose();
    toast.success('Workspace cleared completely!');
  };

  if (!storageUsage) {
    return null;
  }

  const totalItems = storageUsage.canvases + storageUsage.assets + storageUsage.steps;
  const canvasProgress = totalItems > 0 ? (storageUsage.canvases / totalItems) * 100 : 0;
  const assetProgress = totalItems > 0 ? (storageUsage.assets / totalItems) * 100 : 0;
  const stepProgress = totalItems > 0 ? (storageUsage.steps / totalItems) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Storage Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Overview
              </CardTitle>
              <CardDescription>
                Current usage and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{storageUsage.canvases}</div>
                  <div className="text-sm text-muted-foreground">Canvases</div>
                  <Progress value={canvasProgress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{storageUsage.assets}</div>
                  <div className="text-sm text-muted-foreground">Assets</div>
                  <Progress value={assetProgress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{storageUsage.steps}</div>
                  <div className="text-sm text-muted-foreground">Steps</div>
                  <Progress value={stepProgress} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asset Health */}
          {assetAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Asset Health
                </CardTitle>
                <CardDescription>
                  Status of your image assets and URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Healthy Assets:</span>
                    <Badge variant="secondary">{assetAnalysis.healthy.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>Expired URLs:</span>
                    <Badge variant={assetAnalysis.needsMigration > 0 ? "destructive" : "secondary"}>
                      {assetAnalysis.needsMigration}
                    </Badge>
                  </div>
                </div>
                {assetAnalysis.needsMigration > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Some assets have expired URLs and need migration to remain accessible.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Cleanup</CardTitle>
                <CardDescription>
                  Clean up old canvases (keep 20 most recent)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCleanupCanvases}
                  disabled={isCleaning || storageUsage.canvases <= 20}
                  className="w-full"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isCleaning ? 'Cleaning...' : 'Cleanup Canvases'}
                </Button>
                {storageUsage.canvases <= 20 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Canvas count is already optimized
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Full Optimization</CardTitle>
                <CardDescription>
                  Optimize all storage and migrate expired assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleOptimizeStorage}
                  disabled={isOptimizing}
                  className="w-full"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  {isOptimizing ? 'Optimizing...' : 'Optimize Storage'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions - use with caution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleClearWorkspace}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Entire Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will delete all assets, canvases, and project history
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}