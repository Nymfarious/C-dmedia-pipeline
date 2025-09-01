import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Download, RotateCcw, Loader2 } from 'lucide-react';
import { Asset } from '@/types/media';
import { migrateAsset, getAssetErrorMessage, isExpiredUrl } from '@/utils/assetMigration';
import { toast } from 'sonner';

interface ImageLoadingFallbackProps {
  asset: Asset;
  onAssetRecovered?: (recoveredAsset: Asset) => void;
}

export function ImageLoadingFallback({ asset, onAssetRecovered }: ImageLoadingFallbackProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const maxRetries = 3;
  const isExpired = isExpiredUrl(asset.src);
  const errorMessage = getAssetErrorMessage(asset);

  // Auto-retry loading a few times for temporary network issues
  useEffect(() => {
    if (retryCount < maxRetries && !isExpired) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [retryCount, isExpired]);

  const handleRecoverAsset = async () => {
    setIsRecovering(true);
    
    try {
      const recoveredAsset = await migrateAsset(asset);
      if (recoveredAsset) {
        onAssetRecovered?.(recoveredAsset);
        toast.success('Asset recovered successfully!');
      } else {
        throw new Error('Failed to recover asset');
      }
    } catch (error) {
      console.error('Asset recovery failed:', error);
      toast.error('Failed to recover asset. The image may be permanently unavailable.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDownloadOriginal = async () => {
    try {
      // Try to download the original URL anyway (might work sometimes)
      const link = document.createElement('a');
      link.href = asset.src;
      link.download = asset.name || 'image';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Unable to download the original image');
    }
  };

  // Show retry loader for temporary issues
  if (retryCount < maxRetries && !isExpired) {
    return (
      <Card className="w-full h-64 flex items-center justify-center bg-muted">
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Loading image... (attempt {retryCount + 1}/{maxRetries})
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-64 flex items-center justify-center bg-muted border-dashed border-2 border-destructive/20">
      <CardContent className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        
        <div>
          <h3 className="font-semibold text-lg mb-2">Image Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-1">
            <strong>{asset.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            {errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {isExpired && (
            <Button 
              onClick={handleRecoverAsset}
              disabled={isRecovering}
              size="sm"
              variant="default"
            >
              {isRecovering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recovering...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recover Asset
                </>
              )}
            </Button>
          )}
          
          <Button 
            onClick={handleDownloadOriginal}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Try Download
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: You can regenerate this image or import a new one to replace it.
        </p>
      </CardContent>
    </Card>
  );
}