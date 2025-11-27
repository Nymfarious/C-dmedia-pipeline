# Mini DevTools

A reusable, config-driven development tools drawer for Echoverse applications.

## Features

- 🎯 **Config-Driven**: Customize app metadata, enabled panels, and positioning
- 🔌 **Extensible**: Register custom panels for app-specific functionality
- 🎨 **Consistent UI**: Glassmorphism design with dark theme
- 📊 **Comprehensive**: 13 built-in panels covering all aspects of development
- 🚦 **Feature Flags**: Control visibility via feature flags
- 📝 **Logging**: Automatic console interception with red dot notifications

## Installation

The module is self-contained in `src/mini-devtools/`. Simply import and wrap your app:

```tsx
import { MiniDevProvider, MiniDevButton, MiniDevDrawer } from '@/mini-devtools';

function App() {
  return (
    <MiniDevProvider
      config={{
        app: {
          name: 'My App',
          version: '1.0.0',
          environment: 'dev',
        },
        position: 'bottom-right',
      }}
    >
      {/* Your app content */}
      <MiniDevButton />
      <MiniDevDrawer />
    </MiniDevProvider>
  );
}
```

## Configuration

### Basic Config

```tsx
interface MiniDevConfig {
  app: {
    name: string;           // App name shown in header
    version: string;        // Version number
    environment: 'dev' | 'staging' | 'production';
  };
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  panels?: string[];        // Optional: subset of panel IDs to show
  customPanels?: CustomPanelConfig[];  // Optional: app-specific panels
}
```

### Custom Panels

Register app-specific panels:

```tsx
import { GitBranch } from 'lucide-react';
import { MyCustomPanel } from './MyCustomPanel';

<MiniDevProvider
  config={{
    app: { name: 'Storybook', version: '0.1.0', environment: 'dev' },
    customPanels: [
      {
        id: 'custom',
        name: 'Custom Tool',
        icon: GitBranch,
        component: MyCustomPanel,
      },
    ],
  }}
>
  {/* ... */}
</MiniDevProvider>
```

### Panel Filtering

Show only specific panels:

```tsx
<MiniDevProvider
  config={{
    app: { /* ... */ },
    panels: ['overview', 'logs', 'apis'], // Only these 3 panels
  }}
>
```

## Built-in Panels

| ID | Name | Description |
|---|---|---|
| `overview` | Overview | App metadata, user info, quick links |
| `audio` | Audio | Volume controls, test audio playback |
| `video` | Video/Animation | Rive status, FPS counter, debug mode |
| `text` | Text/Content | JSON inspector, schema validation |
| `libraries` | Libraries | Package dependencies (placeholder) |
| `apis` | APIs | API registry, connection testing |
| `mcp` | MCP/Agents | AI agent console, call history |
| `data` | Data & Test | Database viewer (placeholder) |
| `flowchart` | Flowchart | Route visualization, draggable nodes |
| `tokens` | UI Tokens | Color swatches, typography, theme toggle |
| `logs` | Logs | Console logs, error tracking, red dots |
| `security` | Security | Edge functions, RLS policies, secrets |
| `pipeline` | Pipeline Monitor | AI pipeline events, asset lineage |

## Stores & Hooks

### Logging

```tsx
import { logDevEvent } from '@/mini-devtools';

// Log from anywhere in your app
logDevEvent('error', 'API call failed', { url, status });
logDevEvent('info', 'User action completed');
logDevEvent('warn', 'Rate limit approaching');
```

### Pipeline Tracking

```tsx
import { recordPipelineEvent } from '@/mini-devtools';

recordPipelineEvent({
  step: 'generate_image',
  provider: 'gemini-2.5',
  duration: 2340,
  success: true,
  assetId: 'img-001',
  metadata: { prompt: 'A sunset', resolution: '1024x1024' },
});
```

### Audio Settings

```tsx
import { useAudioStore } from '@/mini-devtools';

const { musicVolume, sfxVolume, setMusicVolume } = useAudioStore();
```

## Feature Flags

Control DevTools via Supabase `feature_flags` table:

```sql
INSERT INTO feature_flags (key, value, app_id)
VALUES 
  ('devtools_enabled', true, 'storybook'),
  ('devtools_panels', '["overview","logs","apis"]', 'storybook'),
  ('devtools_position', 'bottom-right', 'storybook');
```

Hook automatically reads these flags:

```tsx
import { useFeatureFlags } from '@/mini-devtools';

const flags = useFeatureFlags();
// { devtools_enabled: true, devtools_panels: [...], devtools_position: 'bottom-right' }
```

## Theming

Mini DevTools uses glassmorphism design with semantic color tokens:

- Background: `slate-900/95` with backdrop blur
- Cards: `slate-800/50` borders
- Text: `slate-100` (primary), `slate-400` (secondary)
- Accents: Status-based colors (green/yellow/red/blue)

Theme toggle persists preference to localStorage and applies `dark` class to `document.documentElement`.

## Usage in Other Echoverse Apps

### Little Sister (Health App)

```tsx
import { MiniDevProvider, MiniDevButton, MiniDevDrawer } from '@/mini-devtools';
import { HeartPulse } from 'lucide-react';
import { HealthMetricsPanel } from './panels/HealthMetricsPanel';

<MiniDevProvider
  config={{
    app: { name: 'Little Sister', version: '2.0.0', environment: 'production' },
    panels: ['overview', 'logs', 'security'], // Only relevant panels
    customPanels: [
      {
        id: 'health',
        name: 'Health Metrics',
        icon: HeartPulse,
        component: HealthMetricsPanel,
      },
    ],
  }}
>
  <App />
  <MiniDevButton />
  <MiniDevDrawer />
</MiniDevProvider>
```

### GED Builder (Genealogy)

```tsx
<MiniDevProvider
  config={{
    app: { name: 'GED Builder', version: '1.5.0', environment: 'staging' },
    customPanels: [
      { id: 'tree', name: 'Tree Inspector', icon: Network, component: TreePanel },
    ],
  }}
>
```

## Roadmap

- [ ] Master DevTools aggregation (Phase 8)
- [ ] Real Supabase feature flags integration
- [ ] API registry from database
- [ ] WebSocket status monitoring
- [ ] Performance profiling panel
- [ ] Network request inspector
- [ ] State management debugger

## License

Part of the Echoverse ecosystem.
