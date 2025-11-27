import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDevToolsStore } from '../stores/devToolsStore';
import { Sun, Moon, Monitor } from 'lucide-react';

const colors = {
  primary: { name: 'Slate 900', value: '#0f172a', bg: 'bg-slate-900' },
  secondary: { name: 'Blue 500', value: '#3b82f6', bg: 'bg-blue-500' },
  accent: { name: 'Purple 500', value: '#a855f7', bg: 'bg-purple-500' },
  success: { name: 'Green 500', value: '#22c55e', bg: 'bg-green-500' },
  warning: { name: 'Yellow 500', value: '#eab308', bg: 'bg-yellow-500' },
  caution: { name: 'Orange 500', value: '#f97316', bg: 'bg-orange-500' },
  danger: { name: 'Red 500', value: '#ef4444', bg: 'bg-red-500' },
};

export function UITokensPanel() {
  const { theme, setTheme } = useDevToolsStore();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('system')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(colors).map(([key, color]) => (
              <div key={key} className="space-y-2">
                <div className={`${color.bg} h-16 rounded-md border border-slate-600`} />
                <div className="text-sm text-slate-300 font-medium">{color.name}</div>
                <div className="text-xs text-slate-400 font-mono">{color.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-slate-100">Heading 1</div>
            <div className="text-xs text-slate-400 font-mono mt-1">text-4xl font-bold</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-100">Heading 2</div>
            <div className="text-xs text-slate-400 font-mono mt-1">text-2xl font-semibold</div>
          </div>
          <div>
            <div className="text-lg font-medium text-slate-100">Heading 3</div>
            <div className="text-xs text-slate-400 font-mono mt-1">text-lg font-medium</div>
          </div>
          <div>
            <div className="text-base text-slate-300">Body Text</div>
            <div className="text-xs text-slate-400 font-mono mt-1">text-base</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Small Text</div>
            <div className="text-xs text-slate-400 font-mono mt-1">text-sm text-slate-400</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
