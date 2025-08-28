import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Search, Image, Music, Film, Check, CheckSquare, Square, Download, FolderPlus, Sparkles, Edit, MoreVertical } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { MediaType, Asset, DEFAULT_CATEGORIES } from '@/types/media';
import { cn } from '@/lib/utils';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';

// Helper functions
function getAssetTypeFromFile(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'animation';
  return 'image'; // Default fallback
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | {}> {
  if (!file.type.startsWith('image/')) return {};
  
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function Gallery() {
  const { assets, selectedAssetIds, setSelected, addAssets, exportAssets, updateAssetCategory } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assetArray = Object.values(assets);
  
  const filteredAssets = assetArray
    .filter(asset => {
      if (filterType !== 'all' && asset.type !== filterType) return false;
      if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && asset.subcategory !== subcategoryFilter) return false;
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const availableSubcategories = categoryFilter === 'all' 
    ? []
    : DEFAULT_CATEGORIES.find(cat => cat.id === categoryFilter)?.subcategories || [];

  const handleAssetClick = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      setSelected(selectedAssetIds.filter(id => id !== assetId));
    } else {
      setSelected([...selectedAssetIds, assetId]);
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newAssets: Asset[] = [];

    for (const file of files) {
      const asset: Asset = {
        id: crypto.randomUUID(),
        type: getAssetTypeFromFile(file),
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        src: URL.createObjectURL(file),
        meta: {
          size: file.size,
          mimeType: file.type,
          ...(file.type.startsWith('image/') && await getImageDimensions(file))
        },
        createdAt: Date.now(),
        category: 'uploaded',
        subcategory: file.type.startsWith('image/') ? 'Photos' : 'Assets',
      };
      
      newAssets.push(asset);
    }

    addAssets(newAssets);
    toast.success(`Uploaded ${newAssets.length} asset${newAssets.length > 1 ? 's' : ''}`);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredAssets.map(asset => asset.id);
    setSelected(allFilteredIds);
  };

  const handleClearSelection = () => {
    setSelected([]);
  };

  const handleBatchExport = async () => {
    if (selectedAssetIds.length === 0) return;
    
    try {
      const exports = await exportAssets(selectedAssetIds);
      for (const { name, blob } of exports) {
        const extension = getFileExtensionFromBlob(blob);
        downloadBlob(blob, `${name}.${extension}`);
      }
      toast.success(`Exported ${exports.length} asset${exports.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to export assets');
      console.error('Export error:', error);
    }
  };

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'animation': return <Film className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: MediaType) => {
    switch (type) {
      case 'image': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'animation': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'audio': return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="h-full bg-gallery-bg border-r border-border flex flex-col" data-gallery>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Gallery</h2>
          <div className="flex items-center gap-2">
            {selectedAssetIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBatchExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected ({selectedAssetIds.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" size="sm" onClick={handleUpload}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterType} onValueChange={(value) => setFilterType(value as MediaType | 'all')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="animation">Video</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Filters */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter('all');
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DEFAULT_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableSubcategories.length > 0 && (
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Selection Controls */}
        {Object.keys(assets).length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="text-xs"
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearSelection}
              className="text-xs"
            >
              <Square className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Selection Info */}
        {selectedAssetIds.length > 0 && (
          <div className="mt-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              {selectedAssetIds.length} asset{selectedAssetIds.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-card hover:scale-105 group",
                selectedAssetIds.includes(asset.id) 
                  ? "ring-2 ring-primary shadow-pipeline bg-primary/5" 
                  : "hover:border-primary/50"
              )}
              onClick={() => handleAssetClick(asset.id)}
            >
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs border", getTypeColor(asset.type))}
                  >
                    {getTypeIcon(asset.type)}
                    {asset.type}
                  </Badge>
                  
                  <div className="flex items-center gap-2">
                    {selectedAssetIds.includes(asset.id) && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {DEFAULT_CATEGORIES.map((category) => (
                          <DropdownMenuItem 
                            key={category.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAssetCategory(asset.id, category.id, category.subcategories[0]);
                              toast.success(`Moved to ${category.name}`);
                            }}
                          >
                            {category.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                {/* Asset Preview */}
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative group">
                  <img
                    src={asset.src}
                    alt={asset.name || 'Asset preview'}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                  />
                  
                  {asset.type === 'animation' && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Film className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Asset Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {asset.name}
                  </h3>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </div>
                  
                  {asset.meta && (
                    <div className="flex flex-wrap gap-1">
                      {asset.meta.width && asset.meta.height && (
                        <Badge variant="secondary" className="text-xs">
                          {asset.meta.width}×{asset.meta.height}
                        </Badge>
                      )}
                      {asset.meta.provider && (
                        <Badge variant="secondary" className="text-xs">
                          {asset.meta.provider}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery ? 'Try adjusting your search query' : 'Upload some assets or generate new ones to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}