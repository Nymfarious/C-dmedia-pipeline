import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Send } from 'lucide-react';
import { logDevEvent } from '@/store/devLogsStore';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline';
  description: string;
}

interface CallHistory {
  id: string;
  agent: string;
  prompt: string;
  response: string;
  timestamp: Date;
}

const agents: Agent[] = [
  {
    id: 'illustrator',
    name: 'Story Illustrator Agent',
    status: 'online',
    description: 'Generates consistent character illustrations across scenes',
  },
  {
    id: 'grammar',
    name: 'Grammar Cop Agent',
    status: 'online',
    description: 'Checks and corrects grammar, style, and consistency',
  },
  {
    id: 'timeline',
    name: 'Timeline Manager',
    status: 'offline',
    description: 'Manages story continuity and timeline consistency',
  },
];

export function MCPAgentsPanel() {
  const [selectedAgent, setSelectedAgent] = useState<string>('illustrator');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CallHistory[]>([]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) return;

    setLoading(true);
    logDevEvent('info', `Request sent to ${agent.name}`, { prompt });

    // Mock delay and response
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResponse = `[${agent.name}] Received your request: "${prompt.slice(0, 30)}..."\nProcessing complete. Mock response generated.`;

    const newCall: CallHistory = {
      id: Date.now().toString(),
      agent: agent.name,
      prompt,
      response: mockResponse,
      timestamp: new Date(),
    };

    setHistory(prev => [newCall, ...prev].slice(0, 5));
    logDevEvent('info', `Response from ${agent.name}`, { response: mockResponse });
    setPrompt('');
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Agent List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Available Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700"
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${agent.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-slate-100">{agent.name}</h4>
                  <Badge variant={agent.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{agent.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prompt Console */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Agent Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {agents.filter(a => a.status === 'online').map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-slate-100 min-h-[100px]"
            disabled={loading}
          />

          <Button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to Agent
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Call History */}
      {history.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Calls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((call) => (
              <div key={call.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-300">{call.agent}</span>
                  <span className="text-xs text-slate-500">
                    {call.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-1">
                  <span className="text-slate-500">Prompt:</span> {call.prompt.slice(0, 50)}...
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Response:</span> {call.response.slice(0, 80)}...
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
