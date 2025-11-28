import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logDevEvent } from '../stores/devLogsStore';
import { useIsMobile } from '@/hooks/use-mobile';

const edgeFunctions = [
  'nano-banana-gen',
  'replicate-proxy',
  'tts-generate',
];

const tables = [
  'projects',
  'chapters',
  'pages',
  'assets',
  'characters',
  'comments',
];

const secrets = [
  { key: 'GEMINI_API_KEY', masked: 'sk-...A1B2' },
  { key: 'REPLICATE_API_TOKEN', masked: 'r8-...X9Y0' },
  { key: 'FIREFLY_CLIENT_ID', masked: 'fc-...M3N4' },
  { key: 'GCP_TTS_KEY', masked: null }, // Not set example
];

interface FunctionHealth {
  [key: string]: { status: 'healthy' | 'error' | 'checking'; lastChecked: Date | null };
}

export function SecurityPanel() {
  const [functionHealth, setFunctionHealth] = useState<FunctionHealth>(
    edgeFunctions.reduce((acc, fn) => ({
      ...acc,
      [fn]: { status: 'healthy' as const, lastChecked: new Date() }
    }), {})
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const checkEdgeHealth = async (functionName: string) => {
    setFunctionHealth(prev => ({
      ...prev,
      [functionName]: { ...prev[functionName], status: 'checking' }
    }));

    // Mock health check with random success/failure
    await new Promise(resolve => setTimeout(resolve, 800));
    const isHealthy = Math.random() > 0.3;

    setFunctionHealth(prev => ({
      ...prev,
      [functionName]: {
        status: isHealthy ? 'healthy' : 'error',
        lastChecked: new Date()
      }
    }));

    logDevEvent(
      isHealthy ? 'info' : 'error',
      `Edge function ${functionName}: ${isHealthy ? 'healthy' : 'failed health check'}`
    );
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all(edgeFunctions.map(fn => checkEdgeHealth(fn)));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: 'healthy' | 'error' | 'checking') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-foreground">Security</h3>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Monitor backend security and infrastructure</p>
      </div>

      {/* Edge Functions */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-foreground text-sm md:text-base">Edge Functions</CardTitle>
              <CardDescription className="text-muted-foreground text-xs md:text-sm">Backend serverless functions status</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="text-foreground/70 hover:text-foreground w-full md:w-auto h-10 md:h-9 touch-manipulation"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {edgeFunctions.map((fn) => {
              const health = functionHealth[fn];
              return (
                <div key={fn} className="flex items-center justify-between p-2 md:p-3 bg-background/50 rounded-lg gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    {getStatusIcon(health.status)}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm font-medium text-foreground truncate">{fn}</div>
                      {health.lastChecked && (
                        <div className="text-xs text-muted-foreground">
                          {isMobile ? health.lastChecked.toLocaleTimeString() : `Last: ${health.lastChecked.toLocaleTimeString()}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => checkEdgeHealth(fn)}
                    disabled={health.status === 'checking'}
                    className="text-xs text-muted-foreground hover:text-foreground h-9 w-14 touch-manipulation"
                  >
                    Test
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* RLS Policies */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Row Level Security</CardTitle>
          <CardDescription className="text-muted-foreground text-xs md:text-sm">Database table RLS policy status</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Responsive grid - 2 cols on mobile, 2-3 on larger */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tables.map((table) => (
              <div key={table} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs md:text-sm text-foreground/80 truncate">{table}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secrets Manager */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Secrets Manager</CardTitle>
          <CardDescription className="text-muted-foreground text-xs md:text-sm">
            Environment variables (managed in Supabase Dashboard)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {secrets.map((secret) => (
              <div key={secret.key} className="flex items-center justify-between p-2 md:p-3 bg-background/50 rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm font-medium text-foreground/80 truncate">{secret.key}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    {secret.masked || (
                      <span className="text-yellow-500">Not Set</span>
                    )}
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground touch-manipulation">
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Secrets managed in Supabase Dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
