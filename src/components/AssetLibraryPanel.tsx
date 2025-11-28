import React, { useState } from 'react';
import { Search, Grid, List, Upload, Download, Trash2, Star, StarOff, GripVertical } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'shape' | 'sticker' | 'texture';
  url: string;
  favorite: boolean;
  tags: string[];
  duration?: number;
}

export function AssetLibraryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([{
    id: '1',
    name: 'Mountain landscape',
    type: 'image',
    url: '/api/placeholder/80/80',
    favorite: true,
    tags: ['nature', 'landscape'],
    duration: 5,
  }, {
    id: '2',
    name: 'Abstract pattern',
    type: 'texture',
    url: '/api/placeholder/80/80',
    favorite: false,
    tags: ['abstract', 'pattern'],
    duration: 3,
  }, {
    id: '3',
    name: 'Heart shape',
    type: 'shape',
    url: '/api/placeholder/80/80',
    favorite: false,
    tags: ['shape', 'love'],
    duration: 2,
  }, {
    id: '4',
    name: 'Smile emoji',
    type: 'sticker',
    url: '/api/placeholder/80/80',
    favorite: true,
    tags: ['emoji', 'happy'],
    duration: 4,
  }]);
  const categories = [{
    id: 'all',
    name: 'All',
    count: assets.length
  }, {
    id: 'image',
    name: 'Images',
    count: assets.filter(a => a.type === 'image').length
  }, {
    id: 'shape',
    name: 'Shapes',
    count: assets.filter(a => a.type === 'shape').length
  }, {
    id: 'sticker',
    name: 'Stickers',
    count: assets.filter(a => a.type === 'sticker').length
  }, {
    id: 'texture',
    name: 'Textures',
    count: assets.filter(a => a.type === 'texture').length
  }];
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const toggleFavorite = (id: string) => {
    setAssets(assets.map(asset => asset.id === id ? {
      ...asset,
      favorite: !asset.favorite
    } : asset));
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    // Set proper data transfer for timeline drop
    const dragData = JSON.stringify({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      url: asset.url,
      thumbnail: asset.url,
      duration: asset.duration || 5,
    });
    e.dataTransfer.setData('application/json', dragData);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'shape':
        return '🔷';
      case 'sticker':
        return '😊';
      case 'texture':
        return '🎨';
      default:
        return '📄';
    }
  };
  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
          >
            <List size={16} />
          </button>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Upload size={16} />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
        <div className="space-y-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid/List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Assets</h3>
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset)}
              className={`group relative border border-border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:ring-2 hover:ring-primary/50 ${
                viewMode === 'list' ? 'flex items-center p-2' : 'aspect-square'
              }`}
            >
              {/* Drag handle indicator */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <GripVertical className="h-4 w-4 text-foreground/60" />
              </div>
              <img
                src={asset.url}
                alt={asset.name}
                className={viewMode === 'list' ? 'w-12 h-12 rounded object-cover mr-3' : 'w-full h-full object-cover'}
              />
              {viewMode === 'grid' && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => toggleFavorite(asset.id)}
                    className="p-2 bg-background/20 rounded-full backdrop-blur-sm"
                  >
                    {asset.favorite ? (
                      <Star className="text-yellow-500 fill-current" size={16} />
                    ) : (
                      <StarOff className="text-white" size={16} />
                    )}
                  </button>
                </div>
              )}
              {viewMode === 'list' && (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <span className="mr-1">{getTypeIcon(asset.type)}</span>
                        {asset.type}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(asset.id)}
                      className="p-1"
                    >
                      {asset.favorite ? (
                        <Star className="text-yellow-500 fill-current" size={16} />
                      ) : (
                        <StarOff className="text-muted-foreground" size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}