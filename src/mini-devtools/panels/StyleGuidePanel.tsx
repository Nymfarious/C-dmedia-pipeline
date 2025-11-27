import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Copy } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';

const colorPalette = [
  { name: 'Background', class: 'bg-slate-900', hsl: 'hsl(222.2 84% 4.9%)' },
  { name: 'Card', class: 'bg-slate-800/50', hsl: 'hsl(217.2 32.6% 17.5%)' },
  { name: 'Border', class: 'bg-slate-700', hsl: 'hsl(215.3 25% 26.7%)' },
  { name: 'Text Primary', class: 'bg-slate-100', hsl: 'hsl(210 40% 98%)' },
  { name: 'Text Secondary', class: 'bg-slate-400', hsl: 'hsl(215.4 16.3% 46.9%)' },
  { name: 'Success', class: 'bg-green-500', hsl: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Warning', class: 'bg-yellow-500', hsl: 'hsl(47.9 95.8% 53.1%)' },
  { name: 'Danger', class: 'bg-red-500', hsl: 'hsl(0 84.2% 60.2%)' },
  { name: 'Info', class: 'bg-blue-500', hsl: 'hsl(217.2 91.2% 59.8%)' },
  { name: 'Accent', class: 'bg-purple-500', hsl: 'hsl(270.7 91% 65.1%)' },
  { name: 'Cyan', class: 'bg-cyan-500', hsl: 'hsl(188.7 94.5% 42.7%)' },
  { name: 'Orange', class: 'bg-orange-500', hsl: 'hsl(24.6 95% 53.1%)' },
  { name: 'Pink', class: 'bg-pink-500', hsl: 'hsl(330.4 81.2% 60.4%)' },
];

const badgeVariants = [
  { name: 'Success', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'Warning', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { name: 'Danger', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { name: 'Info', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'Accent', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'Cyan', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Orange', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'Pink', className: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
];

export function StyleGuidePanel() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    logDevEvent('info', 'Color code copied', { text });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Palette className="h-7 w-7" />
          Style Guide
        </h3>
        <p className="text-slate-400 mt-2">Design tokens and component patterns</p>
      </div>

      {/* Color Palette */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Color Palette</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          {colorPalette.map((color) => (
            <div
              key={color.name}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-md ${color.class} border border-slate-600`} />
                <div>
                  <div className="text-sm font-medium text-slate-200">{color.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{color.class}</div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(color.hsl)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700/50"
              >
                <Copy className="h-3 w-3" />
                {color.hsl}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Badge Variants */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Badge Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {badgeVariants.map((variant) => (
            <div
              key={variant.name}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700"
            >
              <Badge className={variant.className}>
                {variant.name}
              </Badge>
              <button
                onClick={() => copyToClipboard(variant.className)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700/50"
              >
                <Copy className="h-3 w-3" />
                Copy Classes
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-100">Heading 1</h1>
            <code className="text-xs text-slate-500 font-mono">text-4xl font-bold</code>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Heading 2</h2>
            <code className="text-xs text-slate-500 font-mono">text-2xl font-semibold</code>
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-100">Heading 3</h3>
            <code className="text-xs text-slate-500 font-mono">text-lg font-medium</code>
          </div>
          <div>
            <p className="text-base text-slate-300">Body text - Regular paragraph content</p>
            <code className="text-xs text-slate-500 font-mono">text-base text-slate-300</code>
          </div>
          <div>
            <p className="text-sm text-slate-400">Small text - Secondary information</p>
            <code className="text-xs text-slate-500 font-mono">text-sm text-slate-400</code>
          </div>
          <div>
            <p className="text-xs text-slate-500">Extra small - Timestamps and metadata</p>
            <code className="text-xs text-slate-500 font-mono">text-xs text-slate-500</code>
          </div>
        </CardContent>
      </Card>

      {/* Button States */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Button States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Palette className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </CardContent>
      </Card>

      {/* Component Patterns */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Component Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Glassmorphism Card</div>
            <code className="text-xs text-slate-400 block bg-slate-900/50 p-2 rounded">
              bg-slate-800/50 border-slate-700
            </code>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Drawer Background</div>
            <code className="text-xs text-slate-400 block bg-slate-900/50 p-2 rounded">
              bg-slate-900/95 backdrop-blur-xl
            </code>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Red Dot Notification</div>
            <code className="text-xs text-slate-400 block bg-slate-900/50 p-2 rounded">
              w-2 h-2 bg-red-500 rounded-full animate-pulse
            </code>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Smooth Transition</div>
            <code className="text-xs text-slate-400 block bg-slate-900/50 p-2 rounded">
              transition-transform duration-300 ease-out
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
