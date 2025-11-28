import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Film, RefreshCw, Activity } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';

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
    <div className="space-y-3 md:space-y-4 overflow-x-hidden">
      {/* Rive Status */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm md:text-base">
            <Film className="h-4 w-4 md:h-5 md:w-5" />
            Rive Runtime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between min-h-[44px]">
            <span className="text-xs md:text-sm text-muted-foreground">Status</span>
            <Badge 
              variant={riveStatus === 'loaded' ? 'default' : 'destructive'}
              className={`text-xs ${riveStatus === 'loaded' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
            >
              {riveStatus === 'loaded' ? 'Runtime loaded' : riveStatus === 'error' ? 'Error' : 'Not initialized'}
            </Badge>
          </div>

          <div className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor="debug-mode" className="text-foreground/80 text-sm">Debug Mode</Label>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={handleDebugToggle}
              className="touch-manipulation"
            />
          </div>

          <Button
            onClick={handleRestart}
            variant="outline"
            className="w-full h-10 md:h-9 touch-manipulation"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Animation
          </Button>
        </CardContent>
      </Card>

      {/* FPS Counter */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm md:text-base">
            <Activity className="h-4 w-4 md:h-5 md:w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Current FPS</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl md:text-2xl font-mono font-bold ${fps >= 58 ? 'text-green-400' : 'text-yellow-400'}`}>
                {fps}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">fps</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Target FPS</span>
            <Badge variant="outline" className="text-foreground/80 text-xs">
              60 fps
            </Badge>
          </div>

          {/* FPS Bar */}
          <div className="space-y-1">
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                style={{ width: `${(fps / 60) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {fps >= 58 ? 'Optimal' : 'Below target'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loaded Animations */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Loaded Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockAnimations.map((anim) => (
            <div
              key={anim.id}
              className="flex items-center justify-between p-2 md:p-3 rounded bg-background/50 border border-border"
            >
              <span className="text-xs md:text-sm text-foreground/80 font-mono truncate">{anim.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">{anim.size}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
