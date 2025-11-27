# Mini DevTools - Quick Reference

## Zustand Stores Summary

### useDevToolsStore
**State:**
- `isOpen: boolean` - Drawer visibility state
- `activeSection: string` - Currently selected panel ID
- `theme: 'light' | 'dark' | 'system'` - Theme preference

**Actions:**
- `toggleDrawer()` - Toggle drawer open/closed
- `setActiveSection(section: string)` - Switch to a panel
- `closeDrawer()` - Close the drawer
- `setTheme(theme)` - Set theme preference

**Example:**
```tsx
import { useDevToolsStore } from '@/mini-devtools';

const { isOpen, toggleDrawer, setActiveSection } = useDevToolsStore();
```

---

### useDevLogsStore
**State:**
- `logs: DevLog[]` - Array of log entries
- `hasUnreadErrors: boolean` - Red dot indicator state

**Actions:**
- `addLog(log)` - Add new log entry
- `markAllRead()` - Clear unread error state
- `clearLogs()` - Remove all logs

**Helper Function:**
```tsx
import { logDevEvent } from '@/mini-devtools';

logDevEvent('error', 'API failed', { url: '/api/data', status: 500 });
logDevEvent('info', 'User logged in');
logDevEvent('warn', 'Cache miss detected');
```

---

### usePipelineStore
**State:**
- `events: PipelineEvent[]` - AI pipeline operation history

**Actions:**
- `addEvent(event)` - Record new pipeline event
- `clearEvents()` - Clear all events

**Helper Function:**
```tsx
import { recordPipelineEvent } from '@/mini-devtools';

recordPipelineEvent({
  step: 'generate_image',
  provider: 'gemini-2.5',
  duration: 2340,
  success: true,
  assetId: 'img-001',
  metadata: { prompt: 'Mountain landscape' }
});
```

**Pipeline Steps:**
- `generate_image` - Image generation
- `edit_image` - Image editing
- `remove_bg` - Background removal
- `upscale` - Image upscaling
- `animate` - Animation generation
- `generate_tts` - Text-to-speech

**Providers:**
- `gemini-2.5` - Google Gemini
- `firefly` - Adobe Firefly
- `replicate` - Replicate API
- `rembg` - Background removal
- `esrgan` - Upscaling
- `gcp-tts` - Google Cloud TTS

---

### useAudioStore
**State:**
- `masterMuted: boolean` - Master mute state
- `musicVolume: number` - Music volume (0-100)
- `sfxVolume: number` - SFX volume (0-100)
- `narrationVolume: number` - Narration volume (0-100)

**Actions:**
- `setMasterMuted(muted: boolean)` - Toggle master mute
- `setMusicVolume(volume: number)` - Set music volume
- `setSfxVolume(volume: number)` - Set SFX volume
- `setNarrationVolume(volume: number)` - Set narration volume

**Example:**
```tsx
import { useAudioStore } from '@/mini-devtools';

const { musicVolume, setMusicVolume } = useAudioStore();

// Connect to your audio system
audioManager.setMusicVolume(musicVolume / 100);
```

---

## Color Palette (Tailwind)

### Background & Surfaces
| Purpose | Tailwind Class | HSL Value | Usage |
|---------|---------------|-----------|-------|
| Background | `slate-900` | `hsl(222.2 84% 4.9%)` | Drawer background, main surfaces |
| Card | `slate-800/50` | `hsl(217.2 32.6% 17.5%)` @ 50% | Card backgrounds |
| Border | `slate-700` | `hsl(215.3 25% 26.7%)` | Borders, dividers |
| Rail | `slate-800/50` | `hsl(217.2 32.6% 17.5%)` @ 50% | Icon rail background |

### Status Colors
| Purpose | Tailwind Class | HSL Value | Usage |
|---------|---------------|-----------|-------|
| Success | `green-500` | `hsl(142.1 76.2% 36.3%)` | Live status, success badges |
| Warning | `yellow-500` | `hsl(47.9 95.8% 53.1%)` | Testing status, warnings |
| Danger | `red-500` | `hsl(0 84.2% 60.2%)` | Error badges, red dots |
| Info | `blue-500` | `hsl(217.2 91.2% 59.8%)` | Selected states, primary actions |

### Accent Colors
| Purpose | Tailwind Class | HSL Value | Usage |
|---------|---------------|-----------|-------|
| Accent | `blue-500` | `hsl(217.2 91.2% 59.8%)` | Links, active states |
| Secondary | `purple-500` | `hsl(270.7 91% 65.1%)` | Gradient accents, special elements |
| Cyan | `cyan-500` | `hsl(188.7 94.5% 42.7%)` | TTS badges, special indicators |
| Orange | `orange-500` | `hsl(24.6 95% 53.1%)` | Animation badges, highlights |
| Pink | `pink-500` | `hsl(330.4 81.2% 60.4%)` | Remove BG badges, special states |

### Text Colors
| Purpose | Tailwind Class | Usage |
|---------|---------------|-------|
| Primary | `slate-100` | Main text, headings |
| Secondary | `slate-400` | Labels, metadata |
| Tertiary | `slate-500` | Timestamps, subtle info |
| Disabled | `slate-600` | Disabled states |

---

## Key Implementation Patterns

### Glassmorphism Effect
```tsx
className="bg-slate-900/95 backdrop-blur-xl border border-slate-700"
```

### Red Dot Notification
```tsx
<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
```

### Drawer Layout
```tsx
// Main drawer
<div className="fixed right-0 top-0 h-full w-[420px] bg-slate-900/95">
  
  // Icon rail
  <div className="w-12 bg-slate-800/50 border-r border-slate-700">
    {/* 48px wide icon rail */}
  </div>
  
  // Content area
  <div className="flex-1">
    {/* Remaining space */}
  </div>
</div>
```

### Smooth Transitions
```tsx
className="transition-transform duration-300 ease-out"

// Drawer slide
className={`transition-transform duration-300 ${
  isOpen ? 'translate-x-0' : 'translate-x-full'
}`}
```

### Card Pattern
```tsx
<Card className="bg-slate-800/50 border-slate-700">
  <CardHeader>
    <CardTitle className="text-slate-100">Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Content */}
  </CardContent>
</Card>
```

### Badge Variants
```tsx
// Environment badges
<Badge 
  variant="secondary" 
  className={
    environment === 'production' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : environment === 'staging'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
>
  {environment}
</Badge>

// Status badges
<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
  Live
</Badge>
```

### Icon Rail Button
```tsx
<button
  className={`w-10 h-10 rounded-md flex items-center justify-center transition-all relative ${
    isActive
      ? 'bg-slate-700 ring-2 ring-blue-500 text-blue-400'
      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
  }`}
>
  <Icon className="h-5 w-5" />
  {showRedDot && (
    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
  )}
</button>
```

---

## Dimensions Reference

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| Drawer | 420px | 100vh | Fixed right side |
| Icon Rail | 48px | 100vh | Fixed width |
| Icon Button | 40px | 40px | Touchable size |
| Floating Button | 56px | 56px | Bottom corner |
| Header | 100% | 64px | Top bar |
| Red Dot | 8px | 8px | Notification indicator |

---

## Z-Index Layers

| Element | Z-Index | Purpose |
|---------|---------|---------|
| Backdrop | 40 | Drawer backdrop overlay |
| Drawer | 50 | Main drawer container |
| Floating Button | 50 | Entry point button |
| Tooltips | 50+ | Tooltip overlays |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close drawer |

---

## Performance Tips

1. **Lazy Load Panels**: Custom panels can be code-split
2. **Limit Logs**: Store maintains last 100 logs only
3. **Limit Events**: Pipeline store keeps last 50 events
4. **Debounce Theme**: Theme changes debounced to localStorage
5. **Memoize Heavy Renders**: Use React.memo for panel content

---

## Common Tasks

### Add a Custom Panel
```tsx
import { MyPanel } from './MyPanel';
import { Sparkles } from 'lucide-react';

<MiniDevProvider
  config={{
    customPanels: [
      {
        id: 'custom',
        name: 'Custom Panel',
        icon: Sparkles,
        component: MyPanel
      }
    ]
  }}
>
```

### Filter Panels
```tsx
<MiniDevProvider
  config={{
    panels: ['overview', 'logs', 'security'] // Only show these
  }}
>
```

### Change Position
```tsx
<MiniDevProvider
  config={{
    position: 'bottom-left' // 'bottom-right' | 'top-right' | 'top-left'
  }}
>
```

### Access Context in Panel
```tsx
import { useMiniDevContext } from '@/mini-devtools';

export function MyPanel() {
  const { config } = useMiniDevContext();
  return <div>{config.app.name}</div>;
}
```

---

## Testing Checklist

- [ ] Drawer opens/closes smoothly
- [ ] All panels render without errors
- [ ] Red dot appears on errors
- [ ] Red dot clears when Logs panel opened
- [ ] Theme toggle persists to localStorage
- [ ] Custom panels appear in rail
- [ ] Panel filtering works correctly
- [ ] Position changes apply correctly
- [ ] Logs capture console.error/warn
- [ ] Pipeline events record correctly
- [ ] Audio controls persist settings
- [ ] Escape key closes drawer
- [ ] Backdrop click closes drawer
