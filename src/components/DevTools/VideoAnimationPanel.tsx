import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Film, RefreshCw, Activity } from 'lucide-react';
import { logDevEvent } from '@/store/devLogsStore';

const mockAnimations = [
  { id: '1', name: 'narrator.riv', size: '245 KB' },
  { id: '2', name: 'idle-blink.riv', size: '89 KB' },
];

export function VideoAnimationPanel() {
  const [riveStatus, setRiveStatus] = useState<'loaded' | 'error' | 'not-initialized'>('loaded');
  const [debugMode, setDebugMode] = useState(false);
  const [fps, setFps] = useState(60);

  // Simulate FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(58 + Math.random() * 3)); // Random 58-60
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    logDevEvent('info', 'Animation restart triggered', { debugMode });
    // Mock restart animation
  };

  const handleDebugToggle = (checked: boolean) => {
    setDebugMode(checked);
    logDevEvent('info', `Animation debug mode ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-4">
      {/* Rive Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Film className="h-5 w-5" />
            Rive Runtime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Status</span>
            <Badge 
              variant={riveStatus === 'loaded' ? 'default' : 'destructive'}
              className={riveStatus === 'loaded' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
            >
              {riveStatus === 'loaded' ? 'Runtime loaded' : riveStatus === 'error' ? 'Error' : 'Not initialized'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="debug-mode" className="text-slate-300">Debug Mode</Label>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={handleDebugToggle}
            />
          </div>

          <Button
            onClick={handleRestart}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Animation
          </Button>
        </CardContent>
      </Card>

      {/* FPS Counter */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Current FPS</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-mono font-bold ${fps >= 58 ? 'text-green-400' : 'text-yellow-400'}`}>
                {fps}
              </span>
              <span className="text-sm text-slate-500">fps</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Target FPS</span>
            <Badge variant="outline" className="text-slate-300">
              60 fps
            </Badge>
          </div>

          {/* FPS Bar */}
          <div className="space-y-1">
            <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                style={{ width: `${(fps / 60) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              {fps >= 58 ? 'Optimal' : 'Below target'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loaded Animations */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Loaded Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockAnimations.map((anim) => (
            <div
              key={anim.id}
              className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-700"
            >
              <span className="text-sm text-slate-300 font-mono">{anim.name}</span>
              <span className="text-xs text-slate-500">{anim.size}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
