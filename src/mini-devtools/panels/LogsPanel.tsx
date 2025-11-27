import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDevLogsStore, LogLevel } from '../stores/devLogsStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function LogsPanel() {
  const { logs, clearLogs, markAllRead } = useDevLogsStore();
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">All</TabsTrigger>
            <TabsTrigger value="error" className="data-[state=active]:bg-slate-700">Errors</TabsTrigger>
            <TabsTrigger value="warn" className="data-[state=active]:bg-slate-700">Warnings</TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-slate-700">Info</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Logs
        </Button>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              No logs to display
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            
            return (
              <Card key={log.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-3 px-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    {log.context ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-4 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={getLevelBadgeVariant(log.level)}
                          className="text-xs"
                        >
                          {log.level}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {format(log.timestamp, 'HH:mm:ss.SSS')}
                        </span>
                      </div>
                      
                      <div className={`text-sm ${getLevelColor(log.level)} break-words`}>
                        {log.message}
                      </div>
                      
                      {isExpanded && log.context && (
                        <pre className="mt-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded overflow-x-auto">
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
