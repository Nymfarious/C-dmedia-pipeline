import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDevLogsStore, LogLevel, DevLog } from '../stores/devLogsStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Trash2, Copy, Download, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

export function LogsPanel() {
  const { logs, clearLogs, markAllRead } = useDevLogsStore();
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'outline';
    }
  };

  const [copied, setCopied] = useState(false);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
    }
  };

  const formatLogForExport = (log: DevLog) => {
    const timestamp = format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS');
    const context = log.context ? `\n  Context: ${JSON.stringify(log.context, null, 2)}` : '';
    return `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}${context}`;
  };

  const formatLogForJson = (log: DevLog) => ({
    id: log.id,
    level: log.level,
    message: log.message,
    timestamp: log.timestamp.toISOString(),
    context: log.context || null,
    read: log.read,
  });

  const copyAllLogs = async () => {
    const logsText = filteredLogs.map(formatLogForExport).join('\n\n');
    await navigator.clipboard.writeText(logsText);
    setCopied(true);
    toast.success('Logs copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLogs = () => {
    const logsText = filteredLogs.map(formatLogForExport).join('\n\n');
    const header = `=== DevTools Logs Export ===\nGenerated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\nFilter: ${filter}\nTotal logs: ${filteredLogs.length}\n${'='.repeat(30)}\n\n`;
    const blob = new Blob([header + logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Logs downloaded');
  };

  const downloadLogsAsJson = () => {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      filter: filter,
      totalLogs: filteredLogs.length,
      logs: filteredLogs.map(formatLogForJson),
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Logs exported as JSON');
  };

  const copySingleLog = async (log: DevLog) => {
    await navigator.clipboard.writeText(formatLogForExport(log));
    toast.success('Log entry copied');
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-secondary/50 border border-border w-full md:w-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-secondary text-xs md:text-sm flex-1 md:flex-none">
              All
            </TabsTrigger>
            <TabsTrigger value="error" className="data-[state=active]:bg-secondary text-xs md:text-sm flex-1 md:flex-none">
              Errors
            </TabsTrigger>
            <TabsTrigger value="warn" className="data-[state=active]:bg-secondary text-xs md:text-sm flex-1 md:flex-none">
              Warn
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-secondary text-xs md:text-sm flex-1 md:flex-none">
              Info
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllLogs}
            className="flex-1 md:flex-none"
            disabled={filteredLogs.length === 0}
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogs}
            className="flex-1 md:flex-none"
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            .txt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogsAsJson}
            className="flex-1 md:flex-none"
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            .json
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 flex-1 md:flex-none"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Log entries - constrained height for mobile */}
      <div className="space-y-2 max-h-[50vh] md:max-h-[600px] overflow-y-auto overflow-x-hidden">
        {filteredLogs.length === 0 ? (
          <Card className="bg-secondary/50 border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No logs to display
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            
            return (
              <Card key={log.id} className="bg-secondary/50 border-border">
                <CardContent className="py-2 md:py-3 px-3 md:px-4">
                    <div className="flex items-start gap-2 md:gap-3 min-h-[44px]">
                      {/* Copy single log button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          copySingleLog(log);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {log.context ? (
                        <button
                          className="flex-shrink-0 hover:bg-muted rounded p-0.5"
                          onClick={() => toggleExpand(log.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <div className="w-4 flex-shrink-0" />
                      )}
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Mobile: Stack vertically */}
                      {isMobile ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getLevelBadgeVariant(log.level)}
                              className="text-xs"
                            >
                              {log.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(log.timestamp, 'HH:mm:ss')}
                            </span>
                          </div>
                          <div className={`text-sm ${getLevelColor(log.level)} break-words`}>
                            {log.message}
                          </div>
                        </div>
                      ) : (
                        /* Desktop: Inline layout */
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={getLevelBadgeVariant(log.level)}
                              className="text-xs"
                            >
                              {log.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(log.timestamp, 'HH:mm:ss.SSS')}
                            </span>
                          </div>
                          <div className={`text-sm ${getLevelColor(log.level)} break-words`}>
                            {log.message}
                          </div>
                        </>
                      )}
                      
                      {isExpanded && log.context && (
                        <pre className="mt-2 text-xs text-foreground/80 bg-background/50 p-2 rounded overflow-x-auto max-w-full">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
