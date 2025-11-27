import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { logDevEvent } from '../stores/devLogsStore';

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
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">Security</h3>
        <p className="text-slate-400 mt-2">Monitor backend security and infrastructure</p>
      </div>

      {/* Edge Functions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-100">Edge Functions</CardTitle>
              <CardDescription className="text-slate-400">Backend serverless functions status</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="text-slate-300 hover:text-slate-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {edgeFunctions.map((fn) => {
              const health = functionHealth[fn];
              return (
                <div key={fn} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(health.status)}
                    <div>
                      <div className="text-sm font-medium text-slate-200">{fn}</div>
                      {health.lastChecked && (
                        <div className="text-xs text-slate-500">
                          Last checked: {health.lastChecked.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => checkEdgeHealth(fn)}
                    disabled={health.status === 'checking'}
                    className="text-xs text-slate-400 hover:text-slate-200"
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
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Row Level Security</CardTitle>
          <CardDescription className="text-slate-400">Database table RLS policy status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {tables.map((table) => (
              <div key={table} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-slate-300">{table}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secrets Manager */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Secrets Manager</CardTitle>
          <CardDescription className="text-slate-400">
            Environment variables (managed in Supabase Dashboard)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {secrets.map((secret) => (
              <div key={secret.key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-300">{secret.key}</div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    {secret.masked || (
                      <span className="text-yellow-500">Not Set</span>
                    )}
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
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
