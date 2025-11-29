import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Image, 
  Video, 
  Music, 
  Sparkles,
  FileQuestion,
  Search,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  Trash2,
  Download,
  MoreVertical,
  Star,
  StarOff,
  Eye,
  X,
  ChevronDown
} from 'lucide-react';
import { Asset, MediaType } from '@/types/media';
import useAppStore from '@/store/appStore';
import { cn } from '@/lib/utils';

// Extended asset types for filtering
type AssetTypeFilter = 'all' | 'image' | 'video' | 'audio' | 'animation' | 'fx' | 'unknown';

interface EnhancedAssetLibraryProps {
  onSelectAsset?: (asset: Asset) => void;
  onClose?: () => void;
  className?: string;
  selectable?: boolean;
}

const TYPE_ICONS: Record<AssetTypeFilter, React.ReactNode> = {
  all: <Grid3X3 className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  animation: <Sparkles className="h-4 w-4" />,
  fx: <Sparkles className="h-4 w-4" />,
  unknown: <FileQuestion className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  image: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  video: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  audio: 'bg-green-500/20 text-green-400 border-green-500/30',
  animation: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  fx: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function EnhancedAssetLibrary({ 
  onSelectAsset, 
  onClose,
  className,
  selectable = false 
}: EnhancedAssetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const { assets, deleteAssets, createCanvas, setActiveCanvas } = useAppStore();
  const assetList = Object.values(assets);

  // Determine asset type including extended types
  const getAssetType = (asset: Asset): AssetTypeFilter => {
    // Check for FX type
    if (asset.meta?.sourceType === 'fx' || asset.category === 'fx') {
      return 'fx';
    }
    // Check for sprite-slice
    if (asset.meta?.sourceType === 'sprite-slice') {
      return 'image';
    }
    // Standard types
    if (asset.type === 'animation') return 'animation';
    if (asset.type === 'image') return 'image';
    if (asset.type === 'video') return 'video';
    if (asset.type === 'audio') return 'audio';
    return 'unknown';
  };

  // Get unique categories and sources
  const { uniqueCategories, uniqueSources } = useMemo(() => {
    const categories = new Set<string>();
    const sources = new Set<string>();
    
    assetList.forEach(asset => {
      if (asset.category) categories.add(asset.category);
      if (asset.meta?.sourceType) sources.add(asset.meta.sourceType);
      if (asset.meta?.provider) sources.add(asset.meta.provider);
    });
    
    return {
      uniqueCategories: Array.from(categories),
      uniqueSources: Array.from(sources),
    };
  }, [assetList]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = assetList;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.meta?.prompt?.toLowerCase().includes(query) ||
        asset.category?.toLowerCase().includes(query) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(asset => getAssetType(asset) === typeFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }
    
    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(asset => 
        asset.meta?.sourceType === sourceFilter || 
        asset.meta?.provider === sourceFilter
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = getAssetType(a).localeCompare(getAssetType(b));
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [assetList, searchQuery, typeFilter, categoryFilter, sourceFilter, sortBy, sortOrder]);

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<AssetTypeFilter, number> = {
      all: assetList.length,
      image: 0,
      video: 0,
      audio: 0,
      animation: 0,
      fx: 0,
      unknown: 0,
    };
    
    assetList.forEach(asset => {
      const type = getAssetType(asset);
      counts[type]++;
    });
    
    return counts;
  }, [assetList]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenInCanvas = (asset: Asset) => {
    const canvasType = asset.type === 'video' ? 'video' : asset.type === 'audio' ? 'audio' : 'image';
    const canvasId = createCanvas(canvasType, asset);
    setActiveCanvas(canvasId);
    if (onClose) onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={cn("bg-card border-border flex flex-col h-full", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Asset Library
            <Badge variant="secondary">{assetList.length}</Badge>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Search and Controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* View mode toggle */}
          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-1" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Sort by Date {sortBy === 'date' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Sort by Name {sortBy === 'name' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('type')}>
                Sort by Type {sortBy === 'type' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Type Filter Tabs */}
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as AssetTypeFilter)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {(['all', 'image', 'video', 'audio', 'animation', 'fx'] as AssetTypeFilter[]).map((type) => (
              <TabsTrigger key={type} value={type} className="gap-1 text-xs">
                {TYPE_ICONS[type]}
                <span className="capitalize">{type}</span>
                {typeCounts[type] > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {typeCounts[type]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Additional filters row */}
        <div className="flex gap-2 flex-wrap">
          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                {categoryFilter === 'all' ? 'Category' : categoryFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueCategories.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Source filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {sourceFilter === 'all' ? 'Source' : sourceFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSourceFilter('all')}>
                All Sources
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueSources.map(src => (
                <DropdownMenuItem key={src} onClick={() => setSourceFilter(src)}>
                  {src}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Clear filters */}
          {(categoryFilter !== 'all' || sourceFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setCategoryFilter('all');
                setSourceFilter('all');
                setSearchQuery('');
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Asset List */}
        <ScrollArea className="flex-1">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No assets found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "group relative rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors",
                    selectable && "cursor-pointer"
                  )}
                  onClick={() => selectable && onSelectAsset?.(asset)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-muted">
                    {asset.src ? (
                      asset.type === 'audio' ? (
                        <div className="w-full h-full flex items-center justify-center bg-green-500/10">
                          <Music className="h-8 w-8 text-green-400" />
                        </div>
                      ) : (
                        <img 
                          src={asset.src} 
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {TYPE_ICONS[getAssetType(asset)]}
                      </div>
                    )}
                  </div>
                  
                  {/* Type badge */}
                  <Badge 
                    className={cn(
                      "absolute top-1 left-1 text-xs",
                      TYPE_COLORS[getAssetType(asset)]
                    )}
                  >
                    {getAssetType(asset)}
                  </Badge>
                  
                  {/* Favorite button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(asset.id);
                    }}
                  >
                    {favorites.has(asset.id) ? (
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                  
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2 pt-6">
                    <p className="text-xs truncate text-foreground">{asset.name}</p>
                  </div>
                  
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInCanvas(asset);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open in Canvas</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAssets([asset.id]);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-1">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors group",
                    selectable && "cursor-pointer"
                  )}
                  onClick={() => selectable && onSelectAsset?.(asset)}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    {asset.src && asset.type !== 'audio' ? (
                      <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {TYPE_ICONS[getAssetType(asset)]}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <Badge className={cn("text-xs", TYPE_COLORS[getAssetType(asset)])}>
                        {getAssetType(asset)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(asset.createdAt)}
                      {asset.category && ` • ${asset.category}`}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id);
                      }}
                    >
                      {favorites.has(asset.id) ? (
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInCanvas(asset);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAssets([asset.id]);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
