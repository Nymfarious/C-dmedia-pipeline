import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdapterHealthView } from './AdapterHealthView';
import { JobHistoryView } from './JobHistoryView';
import { StepLogsView } from './StepLogsView';
import { CacheView } from './CacheView';
import { Activity, History, FileText, Database, Settings, X } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState('health');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Debug Panel</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-full pb-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4 m-4">
              <TabsTrigger value="health" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Health
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-1">
                <History className="h-3 w-3" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="cache" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Cache
              </TabsTrigger>
            </TabsList>

            <div className="px-4 h-full overflow-hidden">
              <TabsContent value="health" className="h-full">
                <ScrollArea className="h-full">
                  <AdapterHealthView />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="jobs" className="h-full">
                <ScrollArea className="h-full">
                  <JobHistoryView />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="logs" className="h-full">
                <ScrollArea className="h-full">
                  <StepLogsView />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="cache" className="h-full">
                <ScrollArea className="h-full">
                  <CacheView />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export function DebugPanelSummary() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">System Health</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(true)}
              className="h-6 px-2"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300">
              8 Healthy
            </Badge>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
              2 Degraded
            </Badge>
            <Badge variant="destructive" className="bg-red-500/20 text-red-700 dark:text-red-300">
              1 Failed
            </Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Last check: 2 minutes ago
          </div>
        </CardContent>
      </Card>

      <DebugPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}