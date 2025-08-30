import React, { useState } from 'react';
import { Search, Grid, List, Upload, Download, Trash2, Star, StarOff } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'shape' | 'sticker' | 'texture';
  url: string;
  favorite: boolean;
  tags: string[];
}

export function AssetLibraryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'Mountain landscape', type: 'image', url: '/api/placeholder/80/80', favorite: true, tags: ['nature', 'landscape'] },
    { id: '2', name: 'Abstract pattern', type: 'texture', url: '/api/placeholder/80/80', favorite: false, tags: ['abstract', 'pattern'] },
    { id: '3', name: 'Heart shape', type: 'shape', url: '/api/placeholder/80/80', favorite: false, tags: ['shape', 'love'] },
    { id: '4', name: 'Smile emoji', type: 'sticker', url: '/api/placeholder/80/80', favorite: true, tags: ['emoji', 'happy'] },
  ]);

  const categories = [
    { id: 'all', name: 'All', count: assets.length },
    { id: 'image', name: 'Images', count: assets.filter(a => a.type === 'image').length },
    { id: 'shape', name: 'Shapes', count: assets.filter(a => a.type === 'shape').length },
    { id: 'sticker', name: 'Stickers', count: assets.filter(a => a.type === 'sticker').length },
    { id: 'texture', name: 'Textures', count: assets.filter(a => a.type === 'texture').length },
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, favorite: !asset.favorite } : asset
    ));
  };

  const handleDragStart = (asset: Asset) => {
    // Would implement drag data transfer
    console.log('Dragging asset:', asset);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'shape': return '🔷';
      case 'sticker': return '😊';
      case 'texture': return '🎨';
      default: return '📄';
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Assets</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-md ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className={`space-y-2 max-h-64 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2 space-y-0' : ''}`}>
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className={`group border border-border rounded-md overflow-hidden hover:border-primary transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-2'
            }`}
            draggable
            onDragStart={() => handleDragStart(asset)}
          >
            {viewMode === 'grid' ? (
              <div className="relative w-full h-full">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-2xl">{getTypeIcon(asset.type)}</span>
                </div>
                <div className="absolute top-1 right-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(asset.id);
                    }}
                    className="p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    {asset.favorite ? (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-1">
                  <div className="text-xs font-medium truncate">{asset.name}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center mr-3">
                  <span className="text-lg">{getTypeIcon(asset.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{asset.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{asset.type}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(asset.id);
                  }}
                  className="p-1 hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {asset.favorite ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm">No assets found</p>
          <p className="text-xs">Try adjusting your search</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border space-y-2">
        <button className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center justify-center">
          <Upload className="mr-1 h-4 w-4" />
          Upload Asset
        </button>
        <button className="w-full py-2 px-3 bg-muted text-foreground rounded-md hover:bg-muted/80 text-sm flex items-center justify-center">
          <Download className="mr-1 h-4 w-4" />
          Browse Library
        </button>
      </div>
    </div>
  );
}