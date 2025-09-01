import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/appStore';
import { analyzeAssets } from '@/utils/assetMigration';

export function AssetMigrationToast() {
  const { toast } = useToast();
  const { assets, migrateExpiredAssets } = useAppStore();

  useEffect(() => {
    const checkAssets = () => {
      const allAssets = Object.values(assets);
      if (allAssets.length === 0) return;

      const analysis = analyzeAssets(allAssets);
      
      if (analysis.needsMigration > 0) {
        toast({
          title: "Assets Need Migration",
          description: `${analysis.needsMigration} images have expired URLs and need migration for editing.`,
          action: (
            <button
              onClick={() => {
                migrateExpiredAssets();
                toast({
                  title: "Migration Started",
                  description: "Migrating expired assets to permanent storage...",
                });
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Migrate Now
            </button>
          ),
          duration: 10000,
        });
      }
    };

    // Check on mount and when assets change
    checkAssets();
  }, [assets, toast, migrateExpiredAssets]);

  return null;
}