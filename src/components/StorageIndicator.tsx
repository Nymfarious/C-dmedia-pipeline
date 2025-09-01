import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, AlertTriangle } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { analyzeAssets } from '@/utils/assetMigration';
import { StorageManagementModal } from './StorageManagementModal';

export function StorageIndicator() {
  const { assets, canvases, getStorageUsage } = useAppStore();
  const [storageUsage, setStorageUsage] = useState<{ canvases: number; assets: number; steps: number } | null>(null);
  const [expiredAssets, setExpiredAssets] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const updateUsage = async () => {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
      
      const assetsArray = Object.values(assets);
      if (assetsArray.length > 0) {
        const analysis = analyzeAssets(assetsArray);
        setExpiredAssets(analysis.needsMigration);
      } else {
        setExpiredAssets(0);
      }
    };

    updateUsage();
  }, [assets, canvases, getStorageUsage]);

  if (!storageUsage) return null;

  const totalItems = storageUsage.canvases + storageUsage.assets + storageUsage.steps;
  const hasIssues = storageUsage.canvases > 20 || expiredAssets > 0;

  return (
    <>
      <Button
        variant={hasIssues ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <HardDrive className="h-4 w-4" />
        <span className="hidden sm:inline">{totalItems} items</span>
        <Badge variant={hasIssues ? "destructive" : "secondary"} className="ml-1">
          {storageUsage.canvases}
        </Badge>
        {expiredAssets > 0 && (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        )}
      </Button>

      <StorageManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}