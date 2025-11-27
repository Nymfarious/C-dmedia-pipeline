import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';

type ApiStatus = 'live' | 'testing' | 'planned' | 'deprecated';
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
    status: 'live',
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
    status: 'live',
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
];

const statusConfig: Record<ApiStatus, { color: string; label: string }> = {
  live: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Live' },
  testing: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Testing' },
  planned: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Planned' },
  deprecated: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Deprecated' },
};

export function APIsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

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
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">API Registry</h3>
        <p className="text-slate-400 mt-2">External services and integrations</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-slate-200">
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API Cards */}
      <div className="space-y-3">
        {filteredApis.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              No APIs found matching your filters
            </CardContent>
          </Card>
        ) : (
          filteredApis.map((api) => {
            const status = testingStatus[api.id] || 'idle';
            const statusStyle = statusConfig[api.status];

            return (
              <Card key={api.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base text-slate-100">{api.name}</CardTitle>
                        <Badge className={statusStyle.color}>
                          {statusStyle.label}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400 text-sm">
                        {api.vendor} • {api.category}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(api)}
                      disabled={status === 'testing'}
                      className="text-slate-300 hover:text-slate-100"
                    >
                      {getTestIcon(status)}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{api.purpose}</span>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
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
