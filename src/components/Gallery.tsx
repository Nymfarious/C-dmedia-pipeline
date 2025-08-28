import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Image, Music, Film, Check } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { MediaType } from '@/types/media';
import { cn } from '@/lib/utils';

export function Gallery() {
  const { assets, selectedAssetIds, setSelected } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');

  const assetArray = Object.values(assets);
  
  const filteredAssets = assetArray
    .filter(asset => {
      if (filterType !== 'all' && asset.type !== filterType) return false;
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleAssetClick = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      setSelected(selectedAssetIds.filter(id => id !== assetId));
    } else {
      setSelected([...selectedAssetIds, assetId]);
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
    <div className="h-full bg-gallery-bg border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Gallery</h2>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
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

        {/* Selection Info */}
        {selectedAssetIds.length > 0 && (
          <div className="mt-4 p-2 bg-primary/10 rounded-lg border border-primary/20">
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
                  
                  {selectedAssetIds.includes(asset.id) && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                {/* Asset Preview */}
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative group">
                  <img
                    src={asset.src}
                    alt={asset.name}
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