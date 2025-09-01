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
  const [assets, setAssets] = useState<Asset[]>([{
    id: '1',
    name: 'Mountain landscape',
    type: 'image',
    url: '/api/placeholder/80/80',
    favorite: true,
    tags: ['nature', 'landscape']
  }, {
    id: '2',
    name: 'Abstract pattern',
    type: 'texture',
    url: '/api/placeholder/80/80',
    favorite: false,
    tags: ['abstract', 'pattern']
  }, {
    id: '3',
    name: 'Heart shape',
    type: 'shape',
    url: '/api/placeholder/80/80',
    favorite: false,
    tags: ['shape', 'love']
  }, {
    id: '4',
    name: 'Smile emoji',
    type: 'sticker',
    url: '/api/placeholder/80/80',
    favorite: true,
    tags: ['emoji', 'happy']
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
  const handleDragStart = (asset: Asset) => {
    // Would implement drag data transfer
    console.log('Dragging asset:', asset);
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
  return;
}