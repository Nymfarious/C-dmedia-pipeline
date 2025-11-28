import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeAssets, getAssetErrorMessage } from '@/utils/assetMigration';
import { Asset } from '@/types/media';
import useAppStore from '@/store/appStore';

interface MigrationCandidate {
  id: string;
  name: string;
  type: string;
  reason: string;
  thumbnail?: string;
  createdAt: number;
}

export function AssetMigrationPanel() {
  const { assets } = useAppStore();
  const [candidates, setCandidates] = useState<MigrationCandidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<Record<string, 'pending' | 'migrating' | 'success' | 'failed'>>({});

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const results = analyzeAssets(Object.values(assets));
      
      // Convert expired assets to migration candidates
      const migrationCandidates: MigrationCandidate[] = results.expired.map((asset: Asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type || 'image',
        reason: getAssetErrorMessage(asset),
        thumbnail: asset.src,
        createdAt: asset.createdAt,
      }));
      
      setCandidates(migrationCandidates);
      setLastAnalyzed(new Date());
      
      // Initialize progress state
      const progress: Record<string, 'pending' | 'migrating' | 'success' | 'failed'> = {};
      migrationCandidates.forEach(c => {
        progress[c.id] = 'pending';
      });
      setMigrationProgress(progress);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Run initial analysis
    runAnalysis();
  }, []);

  const handleRetryMigration = async (candidate: MigrationCandidate) => {
    setMigrationProgress(prev => ({ ...prev, [candidate.id]: 'migrating' }));
    
    try {
      // Simulate migration attempt - in real implementation this would:
      // 1. Fetch the image from the original URL
      // 2. Store it locally or in cloud storage
      // 3. Update the asset with the new URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, randomly succeed or fail
      const success = Math.random() > 0.3;
      
      if (success) {
        setMigrationProgress(prev => ({ ...prev, [candidate.id]: 'success' }));
        setCandidates(prev => prev.filter(c => c.id !== candidate.id));
      } else {
        throw new Error('Migration failed');
      }
    } catch (error) {
      setMigrationProgress(prev => ({ ...prev, [candidate.id]: 'failed' }));
    }
  };

  const handleRetryAll = async () => {
    for (const candidate of candidates) {
      if (migrationProgress[candidate.id] !== 'success') {
        await handleRetryMigration(candidate);
      }
    }
  };

  const getStatusIcon = (status: 'pending' | 'migrating' | 'success' | 'failed') => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'migrating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const failedCount = candidates.filter(c => migrationProgress[c.id] === 'failed').length;
  const pendingCount = candidates.filter(c => migrationProgress[c.id] === 'pending').length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Asset Migration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and fix assets with expired or invalid URLs
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card">
          <div className="text-2xl font-bold text-foreground">{candidates.length}</div>
          <div className="text-xs text-muted-foreground">Total Issues</div>
        </Card>
        <Card className="p-3 bg-card">
          <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-3 bg-card">
          <div className="text-2xl font-bold text-destructive">{failedCount}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runAnalysis}
          disabled={isAnalyzing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </Button>
        
        {candidates.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleRetryAll}
          >
            <Download className="h-4 w-4 mr-2" />
            Retry All ({pendingCount + failedCount})
          </Button>
        )}
      </div>

      {lastAnalyzed && (
        <p className="text-xs text-muted-foreground">
          Last analyzed: {lastAnalyzed.toLocaleTimeString()}
        </p>
      )}

      {/* Candidates List */}
      {candidates.length === 0 ? (
        <Card className="p-6 bg-card text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-foreground">All assets are healthy!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No migration issues detected
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="p-3 bg-card">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {candidate.thumbnail ? (
                      <img 
                        src={candidate.thumbnail} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(migrationProgress[candidate.id] || 'pending')}
                      <span className="text-sm font-medium text-foreground truncate">
                        {candidate.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {candidate.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {candidate.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRetryMigration(candidate)}
                      disabled={migrationProgress[candidate.id] === 'migrating'}
                    >
                      <RefreshCw className={`h-4 w-4 ${migrationProgress[candidate.id] === 'migrating' ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Progress bar during migration */}
                {migrationProgress[candidate.id] === 'migrating' && (
                  <Progress value={66} className="h-1 mt-2" />
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Help text */}
      <Card className="p-3 bg-muted/30">
        <h4 className="text-xs font-medium text-foreground mb-1">Common issues:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Expired URLs</strong>: Replicate/external URLs expire after time</li>
          <li>• <strong>Missing assets</strong>: File was deleted or moved</li>
          <li>• <strong>Invalid format</strong>: URL format is malformed</li>
        </ul>
      </Card>
    </div>
  );
}
