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
    <div className="space-y-4">
      {/* Audio Context Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Audio Context Status</span>
            <Badge 
              variant={audioContextStatus === 'active' ? 'default' : 'secondary'}
              className={audioContextStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
            >
              {audioContextStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Master Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            {masterMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            Master Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="master-mute" className="text-slate-300">Master Mute</Label>
            <Switch
              id="master-mute"
              checked={masterMuted}
              onCheckedChange={setMasterMuted}
            />
          </div>

          <Button
            onClick={testAudio}
            variant="outline"
            className="w-full"
            disabled={masterMuted}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Audio (440Hz)
          </Button>
        </CardContent>
      </Card>

      {/* Volume Sliders */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Volume Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Music</Label>
              <span className="text-xs text-slate-400">{musicVolume}%</span>
            </div>
            <Slider
              value={[musicVolume]}
              onValueChange={([value]) => setMusicVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">SFX</Label>
              <span className="text-xs text-slate-400">{sfxVolume}%</span>
            </div>
            <Slider
              value={[sfxVolume]}
              onValueChange={([value]) => setSfxVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Narration</Label>
              <span className="text-xs text-slate-400">{narrationVolume}%</span>
            </div>
            <Slider
              value={[narrationVolume]}
              onValueChange={([value]) => setNarrationVolume(value)}
              max={100}
              step={1}
              disabled={masterMuted}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
