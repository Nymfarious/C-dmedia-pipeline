import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';
import { logDevEvent } from '../stores/devLogsStore';

export function AudioPanel() {
  const {
    masterMuted,
    musicVolume,
    sfxVolume,
    narrationVolume,
    setMasterMuted,
    setMusicVolume,
    setSfxVolume,
    setNarrationVolume,
  } = useAudioStore();

  const [audioContextStatus, setAudioContextStatus] = useState<'active' | 'suspended'>('suspended');

  const testAudio = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      setAudioContextStatus('active');
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        logDevEvent('info', 'Audio test completed: 440Hz tone played', { duration: '0.5s' });
      }, 500);
      
      logDevEvent('info', 'Audio test started', { frequency: '440Hz' });
    } catch (error) {
      logDevEvent('error', 'Audio test failed', { error: String(error) });
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 overflow-x-hidden">
      {/* Audio Context Status */}
      <Card className="bg-secondary/50 border-border">
        <CardContent className="py-3 md:py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Audio Context Status</span>
            <Badge 
              variant={audioContextStatus === 'active' ? 'default' : 'secondary'}
              className={`text-xs ${audioContextStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
            >
              {audioContextStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Master Controls */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm md:text-base">
            {masterMuted ? <VolumeX className="h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
            Master Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor="master-mute" className="text-foreground/80 text-sm">Master Mute</Label>
            <Switch
              id="master-mute"
              checked={masterMuted}
              onCheckedChange={setMasterMuted}
              className="touch-manipulation"
            />
          </div>

          <Button
            onClick={testAudio}
            variant="outline"
            className="w-full h-10 md:h-9 touch-manipulation"
            disabled={masterMuted}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Audio (440Hz)
          </Button>
        </CardContent>
      </Card>

      {/* Volume Sliders */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Volume Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 md:space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground/80 text-sm">Music</Label>
              <span className="text-xs text-muted-foreground">{musicVolume}%</span>
            </div>
            <Slider
              value={[musicVolume]}
              onValueChange={([value]) => setMusicVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground/80 text-sm">SFX</Label>
              <span className="text-xs text-muted-foreground">{sfxVolume}%</span>
            </div>
            <Slider
              value={[sfxVolume]}
              onValueChange={([value]) => setSfxVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground/80 text-sm">Narration</Label>
              <span className="text-xs text-muted-foreground">{narrationVolume}%</span>
            </div>
            <Slider
              value={[narrationVolume]}
              onValueChange={([value]) => setNarrationVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer touch-manipulation"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
