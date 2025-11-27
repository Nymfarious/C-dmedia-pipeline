import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Download, CheckCircle } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';

const iconOptions = [
  'Activity', 'AlertCircle', 'Archive', 'BarChart', 'Bell', 'Book', 'Box',
  'Calendar', 'Camera', 'Check', 'Clock', 'Cloud', 'Code', 'Database',
  'FileText', 'Filter', 'Folder', 'GitBranch', 'Globe', 'Heart', 'Home',
  'Image', 'Inbox', 'Info', 'Layers', 'Layout', 'Link', 'List', 'Lock',
  'Mail', 'Map', 'MessageSquare', 'Music', 'Package', 'Settings', 'Share',
  'Shield', 'Star', 'Tag', 'Target', 'Terminal', 'TrendingUp', 'User',
  'Users', 'Video', 'Zap'
];

export function PanelGeneratorPanel() {
  const [panelId, setPanelId] = useState('');
  const [panelName, setPanelName] = useState('');
  const [panelIcon, setPanelIcon] = useState('Star');
  const [panelDescription, setPanelDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    const componentName = panelName.replace(/\s+/g, '') + 'Panel';
    const fileName = panelId.replace(/_/g, '-') + '-panel.tsx';

    return `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ${panelIcon} } from 'lucide-react';
import { useMiniDevContext } from '@/mini-devtools';
import { logDevEvent } from '@/mini-devtools';

export function ${componentName}() {
  const { config } = useMiniDevContext();

  const handleAction = () => {
    logDevEvent('info', '${panelName} action triggered');
    // Add your custom logic here
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">${panelName}</h3>
        <p className="text-slate-400 mt-2">${panelDescription || 'Custom panel'}</p>
      </div>

      {/* Status Card Example */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <${panelIcon} className="h-5 w-5" />
            Panel Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Status</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">App</span>
            <span className="text-sm text-slate-100">{config.app.name}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Card Example */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAction}
            className="w-full"
          >
            Trigger Action
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}`;
  };

  const registrationCode = `// Add to your app configuration
import { ${panelName.replace(/\s+/g, '')}Panel } from './panels/${panelId.replace(/_/g, '-')}-panel';
import { ${panelIcon} } from 'lucide-react';

<MiniDevProvider
  config={{
    app: { name: 'Your App', version: '1.0.0', environment: 'dev' },
    customPanels: [
      {
        id: '${panelId}',
        name: '${panelName}',
        icon: ${panelIcon},
        component: ${panelName.replace(/\s+/g, '')}Panel,
      },
    ],
  }}
>
  {/* Your app */}
</MiniDevProvider>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCode() + '\n\n' + registrationCode);
    setCopied(true);
    logDevEvent('info', 'Panel code copied to clipboard', { panelId, panelName });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fileName = `${panelId.replace(/_/g, '-')}-panel.tsx`;
    const blob = new Blob([generateCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    logDevEvent('info', 'Panel code downloaded', { fileName });
  };

  const isValid = panelId && panelName;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">Panel Generator</h3>
        <p className="text-slate-400 mt-2">Generate boilerplate for custom DevTools panels</p>
      </div>

      {/* Configuration Form */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Panel Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="panel-id" className="text-slate-300">Panel ID</Label>
            <Input
              id="panel-id"
              placeholder="custom_panel"
              value={panelId}
              onChange={(e) => setPanelId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              className="bg-slate-900/50 border-slate-700 text-slate-100"
            />
            <p className="text-xs text-slate-500">Lowercase with underscores (e.g., custom_metrics)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-name" className="text-slate-300">Panel Name</Label>
            <Input
              id="panel-name"
              placeholder="Custom Metrics"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-icon" className="text-slate-300">Icon</Label>
            <Select value={panelIcon} onValueChange={setPanelIcon}>
              <SelectTrigger id="panel-icon" className="bg-slate-900/50 border-slate-700 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon} className="text-slate-200">
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-desc" className="text-slate-300">Description (Optional)</Label>
            <Textarea
              id="panel-desc"
              placeholder="Brief description of what this panel does..."
              value={panelDescription}
              onChange={(e) => setPanelDescription(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-slate-100 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {isValid && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Generated Code
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="bg-slate-700/50 border-slate-600"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="bg-slate-700/50 border-slate-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
              {generateCode()}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <div className="flex gap-2">
            <span className="text-slate-500">1.</span>
            <span>Copy or download the generated panel code</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">2.</span>
            <span>Create a new file: <code className="text-slate-400 bg-slate-900/50 px-1 rounded">src/panels/{panelId.replace(/_/g, '-')}-panel.tsx</code></span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">3.</span>
            <span>Register the panel in your MiniDevProvider config</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">4.</span>
            <span>Customize the panel logic to fit your needs</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
