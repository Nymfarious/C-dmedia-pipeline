import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Asset } from '@/types/media';
import { migrateAsset, analyzeAssets, getAssetErrorMessage } from '@/utils/assetMigration';
import { toast } from 'sonner';

interface AssetMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onAssetsUpdated: (updatedAssets: Asset[]) => void;
}

export function AssetMigrationModal({ isOpen, onClose, assets, onAssetsUpdated }: AssetMigrationModalProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState<string>('');

  const analysis = analyzeAssets(assets);

  const handleMigrate = async () => {
    if (analysis.needsMigration === 0) return;

    setIsMigrating(true);
    setProgress(0);

    const migratedAssets: Asset[] = [...analysis.healthy];
    let processedCount = 0;

    for (const expiredAsset of analysis.expired) {
      setCurrentAsset(expiredAsset.name);
      
      try {
        const migratedAsset = await migrateAsset(expiredAsset);
        if (migratedAsset) {
          migratedAssets.push(migratedAsset);
          toast.success(`Migrated: ${expiredAsset.name}`);
        } else {
          // Keep original asset even if migration failed
          migratedAssets.push(expiredAsset);
          toast.error(`Failed to migrate: ${expiredAsset.name}`);
        }
      } catch (error) {
        console.error(`Migration error for ${expiredAsset.name}:`, error);
        migratedAssets.push(expiredAsset);
        toast.error(`Migration failed: ${expiredAsset.name}`);
      }

      processedCount++;
      setProgress((processedCount / analysis.needsMigration) * 100);
    }

    onAssetsUpdated(migratedAssets);
    setIsMigrating(false);
    setCurrentAsset('');
    onClose();
    
    const successCount = migratedAssets.length - analysis.healthy.length;
    toast.success(`Migration complete! ${successCount}/${analysis.needsMigration} assets migrated.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asset Migration Required</DialogTitle>
          <DialogDescription>
            {analysis.needsMigration > 0 ? (
              <>
                {analysis.needsMigration} of your assets have expired URLs and need to be migrated to permanent storage.
              </>
            ) : (
              'All your assets are healthy and no migration is needed.'
            )}
          </DialogDescription>
        </DialogHeader>

        {analysis.needsMigration > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Expired assets:</strong> {analysis.needsMigration}</p>
              <p><strong>Healthy assets:</strong> {analysis.healthy.length}</p>
            </div>

            {analysis.expired.slice(0, 3).map((asset) => (
              <div key={asset.id} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{asset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getAssetErrorMessage(asset)}
                </p>
              </div>
            ))}

            {analysis.expired.length > 3 && (
              <p className="text-sm text-muted-foreground">
                ...and {analysis.expired.length - 3} more assets
              </p>
            )}

            {isMigrating && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Migrating: {currentAsset}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isMigrating}>
            {analysis.needsMigration === 0 ? 'Close' : 'Skip'}
          </Button>
          {analysis.needsMigration > 0 && (
            <Button onClick={handleMigrate} disabled={isMigrating}>
              {isMigrating ? 'Migrating...' : `Migrate ${analysis.needsMigration} Assets`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
