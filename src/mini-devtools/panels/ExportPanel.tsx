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
    return {
      metadata: {
        appName: config.app.name,
        appVersion: config.app.version,
        environment: config.app.environment,
        exportedAt: timestamp.toISOString(),
      },
      ...(includeSystemInfo && {
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
      }),
      ...(includeLogs && { logs: { total: logs.length, entries: logs } }),
      ...(includePipeline && { pipeline: { total: events.length, events } }),
      ...(includeAudio && { audioSettings }),
    };
  };

  const handleExport = () => {
    const report = generateReport();
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const fileName = `devtools-report_${timestamp}.json`;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    logDevEvent('info', 'DevTools report exported', { fileName });
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const totalSections = [includeLogs, includePipeline, includeAudio, includeSystemInfo].filter(Boolean).length;

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 md:h-7 md:w-7" />
          Export Report
        </h3>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Generate debugging report</p>
      </div>

      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Report Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Application</span>
            <span className="text-xs md:text-sm text-foreground truncate ml-2">{config.app.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Environment</span>
            <Badge variant="secondary" className="text-xs">{config.app.environment}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">Sections</span>
            <span className="text-xs md:text-sm text-foreground">{totalSections} selected</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Include in Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {[
            { id: 'logs', label: 'Console Logs', count: logs.length, checked: includeLogs, onChange: setIncludeLogs },
            { id: 'pipeline', label: 'Pipeline Events', count: events.length, checked: includePipeline, onChange: setIncludePipeline },
            { id: 'audio', label: 'Audio Settings', checked: includeAudio, onChange: setIncludeAudio },
            { id: 'system', label: 'System Info', checked: includeSystemInfo, onChange: setIncludeSystemInfo },
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2 min-h-[44px]">
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={(checked) => item.onChange(checked as boolean)}
                className="touch-manipulation"
              />
              <Label htmlFor={item.id} className="text-foreground/80 flex-1 cursor-pointer text-sm">
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">{item.count}</Badge>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardContent className="py-4">
          <Button
            onClick={handleExport}
            className="w-full h-10 md:h-9 touch-manipulation"
            disabled={totalSections === 0}
          >
            {exported ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Exported</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Download Report</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
