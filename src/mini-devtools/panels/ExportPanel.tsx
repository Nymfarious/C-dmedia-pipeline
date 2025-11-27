import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { useDevLogsStore } from '../stores/devLogsStore';
import { usePipelineStore } from '../stores/pipelineStore';
import { useAudioStore } from '../stores/audioStore';
import { useMiniDevContext } from '../MiniDevContext';
import { logDevEvent } from '../stores/devLogsStore';
import { format } from 'date-fns';

export function ExportPanel() {
  const { config } = useMiniDevContext();
  const { logs } = useDevLogsStore();
  const { events } = usePipelineStore();
  const audioSettings = useAudioStore();
  
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includePipeline, setIncludePipeline] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);
  const [exported, setExported] = useState(false);

  const generateReport = () => {
    const timestamp = new Date();
    
    const report = {
      metadata: {
        appName: config.app.name,
        appVersion: config.app.version,
        environment: config.app.environment,
        exportedAt: timestamp.toISOString(),
        reportVersion: '1.0.0',
      },
      
      ...(includeSystemInfo && {
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          online: navigator.onLine,
        },
      }),

      ...(includeLogs && {
        logs: {
          total: logs.length,
          errors: logs.filter(l => l.level === 'error').length,
          warnings: logs.filter(l => l.level === 'warn').length,
          info: logs.filter(l => l.level === 'info').length,
          entries: logs.map(log => ({
            level: log.level,
            message: log.message,
            timestamp: log.timestamp.toISOString(),
            context: log.context,
          })),
        },
      }),

      ...(includePipeline && {
        pipeline: {
          total: events.length,
          successful: events.filter(e => e.success).length,
          failed: events.filter(e => !e.success).length,
          avgDuration: events.length > 0
            ? (events.reduce((sum, e) => sum + e.duration, 0) / events.length).toFixed(2)
            : 0,
          events: events.map(event => ({
            step: event.step,
            provider: event.provider,
            duration: event.duration,
            success: event.success,
            timestamp: event.timestamp.toISOString(),
            assetId: event.assetId,
            metadata: event.metadata,
          })),
        },
      }),

      ...(includeAudio && {
        audioSettings: {
          masterMuted: audioSettings.masterMuted,
          musicVolume: audioSettings.musicVolume,
          sfxVolume: audioSettings.sfxVolume,
          narrationVolume: audioSettings.narrationVolume,
        },
      }),
    };

    return report;
  };

  const handleExport = () => {
    const report = generateReport();
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const fileName = `devtools-report_${config.app.name}_${timestamp}.json`;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    logDevEvent('info', 'DevTools report exported', { fileName, sections: Object.keys(report).length });
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleCopyToClipboard = () => {
    const report = generateReport();
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    logDevEvent('info', 'DevTools report copied to clipboard');
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const totalSections = [includeLogs, includePipeline, includeAudio, includeSystemInfo].filter(Boolean).length;
  const estimatedSize = (
    (includeLogs ? logs.length * 0.5 : 0) +
    (includePipeline ? events.length * 0.3 : 0) +
    (includeAudio ? 0.1 : 0) +
    (includeSystemInfo ? 0.5 : 0)
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Export Session Report
        </h3>
        <p className="text-slate-400 mt-2">Generate debugging report for support tickets</p>
      </div>

      {/* Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Report Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Application</span>
            <span className="text-sm text-slate-100">{config.app.name} v{config.app.version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Environment</span>
            <Badge 
              variant="secondary" 
              className={
                config.app.environment === 'production' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : config.app.environment === 'staging'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }
            >
              {config.app.environment}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Sections</span>
            <span className="text-sm text-slate-100">{totalSections} selected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Est. Size</span>
            <span className="text-sm text-slate-100">~{estimatedSize} KB</span>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Include in Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="logs"
              checked={includeLogs}
              onCheckedChange={(checked) => setIncludeLogs(checked as boolean)}
            />
            <Label htmlFor="logs" className="text-slate-300 flex-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <span>Console Logs</span>
                <Badge variant="outline" className="text-xs text-slate-400">
                  {logs.length} entries
                </Badge>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pipeline"
              checked={includePipeline}
              onCheckedChange={(checked) => setIncludePipeline(checked as boolean)}
            />
            <Label htmlFor="pipeline" className="text-slate-300 flex-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <span>Pipeline Events</span>
                <Badge variant="outline" className="text-xs text-slate-400">
                  {events.length} events
                </Badge>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="audio"
              checked={includeAudio}
              onCheckedChange={(checked) => setIncludeAudio(checked as boolean)}
            />
            <Label htmlFor="audio" className="text-slate-300 flex-1 cursor-pointer">
              Audio Settings
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="system"
              checked={includeSystemInfo}
              onCheckedChange={(checked) => setIncludeSystemInfo(checked as boolean)}
            />
            <Label htmlFor="system" className="text-slate-300 flex-1 cursor-pointer">
              System Information
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-4 space-y-2">
          <Button
            onClick={handleExport}
            className="w-full"
            disabled={totalSections === 0}
          >
            {exported ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Exported Successfully
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Report (JSON)
              </>
            )}
          </Button>

          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="w-full"
            disabled={totalSections === 0}
          >
            Copy to Clipboard
          </Button>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <div className="flex gap-2">
            <span className="text-slate-500">1.</span>
            <span>Select which data to include in your report</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">2.</span>
            <span>Download the JSON file or copy to clipboard</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">3.</span>
            <span>Attach the report to support tickets or share with your team</span>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <span className="font-medium">Note:</span> Reports contain debugging data only. No sensitive information is included.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
