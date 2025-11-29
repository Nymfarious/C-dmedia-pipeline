import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';
import { useIsMobile } from '@/hooks/use-mobile';

type ApiStatus = 'live' | 'testing' | 'planned' | 'deprecated' | 'stub';
type ApiCategory = 'AI Generation' | 'Storage' | 'Auth' | 'Analytics' | 'Audio';

interface ApiEntry {
  id: string;
  name: string;
  vendor: string;
  category: ApiCategory;
  purpose: string;
  status: ApiStatus;
  auth_type: string;
}

const mockApiRegistry: ApiEntry[] = [
  {
    id: '1',
    name: 'Nano Banana (Gemini 2.5)',
    vendor: 'Google',
    category: 'AI Generation',
    purpose: 'Image generation and editing',
    status: 'live',
    auth_type: 'API Key',
  },
  {
    id: '2',
    name: 'Adobe Firefly',
    vendor: 'Adobe',
    category: 'AI Generation',
    purpose: 'Creative asset generation',
    status: 'stub',
    auth_type: 'OAuth',
  },
  {
    id: '3',
    name: 'Replicate',
    vendor: 'Replicate',
    category: 'AI Generation',
    purpose: 'ML model hosting',
    status: 'testing',
    auth_type: 'API Key',
  },
  {
    id: '4',
    name: 'Google Cloud TTS',
    vendor: 'Google',
    category: 'Audio',
    purpose: 'Text-to-speech synthesis',
    status: 'stub',
    auth_type: 'API Key',
  },
  {
    id: '5',
    name: 'Supabase Auth',
    vendor: 'Supabase',
    category: 'Auth',
    purpose: 'User authentication',
    status: 'live',
    auth_type: 'Built-in',
  },
  {
    id: '6',
    name: 'Supabase Storage',
    vendor: 'Supabase',
    category: 'Storage',
    purpose: 'File and asset storage',
    status: 'live',
    auth_type: 'Built-in',
  },
  {
    id: '7',
    name: 'Kling AI',
    vendor: 'Kuaishou',
    category: 'AI Generation',
    purpose: 'Video generation',
    status: 'stub',
    auth_type: 'API Key',
  },
  {
    id: '8',
    name: 'Runway ML',
    vendor: 'Runway',
    category: 'AI Generation',
    purpose: 'Video generation & editing',
    status: 'stub',
    auth_type: 'API Key',
  },
];

type ApiStatusExtended = ApiStatus | 'stub';

const statusConfig: Record<ApiStatusExtended, { color: string; label: string; icon?: string }> = {
  live: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Live' },
  testing: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Testing' },
  planned: { color: 'bg-muted/50 text-muted-foreground border-muted', label: 'Planned' },
  deprecated: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Deprecated' },
  stub: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: '✿ Stub', icon: '✿' },
};

export function APIsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const isMobile = useIsMobile();

  const filteredApis = mockApiRegistry.filter((api) => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         api.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || api.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const testConnection = async (api: ApiEntry) => {
    setTestingStatus(prev => ({ ...prev, [api.id]: 'testing' }));
    
    // Mock connection test with 70% success rate
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    const isSuccess = Math.random() > 0.3;

    setTestingStatus(prev => ({ ...prev, [api.id]: isSuccess ? 'success' : 'error' }));

    if (isSuccess) {
      logDevEvent('info', `API test passed: ${api.name}`);
    } else {
      logDevEvent('error', `API test failed: ${api.name} - Connection timeout`, {
        api: api.name,
        vendor: api.vendor,
        category: api.category,
      });
    }

    // Reset status after 2 seconds
    setTimeout(() => {
      setTestingStatus(prev => ({ ...prev, [api.id]: 'idle' }));
    }, 2000);
  };

  const getTestIcon = (status: 'idle' | 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return 'Test';
    }
  };

  const categories = ['all', ...Array.from(new Set(mockApiRegistry.map(api => api.category)))];

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-foreground">API Registry</h3>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">External services and integrations</p>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border text-foreground"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-foreground">
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API Cards - Single column on mobile, responsive grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredApis.length === 0 ? (
          <Card className="bg-secondary/50 border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No APIs found matching your filters
            </CardContent>
          </Card>
        ) : (
          filteredApis.map((api) => {
            const status = testingStatus[api.id] || 'idle';
            const statusStyle = statusConfig[api.status];

            return (
              <Card key={api.id} className="bg-secondary/50 border-border">
                <CardHeader className="pb-2 md:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-sm md:text-base text-foreground">{api.name}</CardTitle>
                        <Badge className={`${statusStyle.color} text-xs`}>
                          {statusStyle.label}
                        </Badge>
                      </div>
                      <CardDescription className="text-muted-foreground text-xs md:text-sm">
                        {api.vendor} • {api.category}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(api)}
                      disabled={status === 'testing'}
                      className="text-foreground/70 hover:text-foreground h-10 w-10 md:h-9 md:w-auto md:px-3 touch-manipulation"
                    >
                      {getTestIcon(status)}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-muted-foreground truncate">{api.purpose}</span>
                    <Badge variant="outline" className="text-muted-foreground border-border flex-shrink-0">
                      {api.auth_type}
                    </Badge>
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
