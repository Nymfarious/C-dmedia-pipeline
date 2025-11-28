import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDevLogsStore, LogLevel } from '../stores/devLogsStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
    }
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

        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 w-full md:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
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
                  <div
                    className="flex items-start gap-2 md:gap-3 cursor-pointer touch-manipulation min-h-[44px]"
                    onClick={() => toggleExpand(log.id)}
                  >
                    {log.context ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      )
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
