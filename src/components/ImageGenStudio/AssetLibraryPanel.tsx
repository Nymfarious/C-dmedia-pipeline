import React, { useState, useMemo } from 'react';
import { PlusCircle, Search, Star, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useImageGenStudioStore } from '@/store/imageGenStudioStore';
import { Asset } from '@/types/media';

export function AssetLibraryPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { assets, allCategories } = useAppStore();
  const { selectedAssets, addSelectedAsset, removeSelectedAsset } = useImageGenStudioStore();

  const assetsList = useMemo(() => Object.values(assets), [assets]);

  const categories = useMemo(() => [
    { name: 'all', label: 'All Assets' },
    ...allCategories.map(cat => ({ name: cat.name, label: cat.name }))
  ], [allCategories]);

  const filteredAssets = useMemo(() => {
    return assetsList.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assetsList, searchTerm, selectedCategory]);

  const isAssetSelected = (asset: Asset) => {
    return selectedAssets.some(selected => selected.id === asset.id);
  };

  const handleAssetClick = (asset: Asset) => {
    if (isAssetSelected(asset)) {
      removeSelectedAsset(asset.id);
    } else {
      addSelectedAsset(asset);
    }
  };

  return (
    <div className="w-full lg:w-1/2 bg-card/50 backdrop-blur-sm rounded-xl p-5 flex flex-col shadow-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Assets</h2>
        <span className="text-sm text-muted-foreground">
          {selectedAssets.length} selected
        </span>
      </div>

      {/* Selected Assets Display */}
      {selectedAssets.length > 0 && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Selected Assets:</div>
          <div className="flex flex-wrap gap-2">
            {selectedAssets.map(asset => (
              <div 
                key={asset.id}
                className="flex items-center bg-primary/20 text-primary px-2 py-1 rounded-md text-sm"
              >
                <span className="truncate max-w-24">{asset.name}</span>
                <X 
                  size={14} 
                  className="ml-1 cursor-pointer hover:text-primary-foreground"
                  onClick={() => removeSelectedAsset(asset.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search assets..."
          className="w-full pl-10 pr-4 py-2 bg-input rounded-lg border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                selectedCategory === category.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
        {filteredAssets.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <PlusCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No assets found</p>
            <p className="text-sm">Add assets to your library to use them here</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <div
              key={asset.id}
              onClick={() => handleAssetClick(asset)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] border ${
                isAssetSelected(asset)
                  ? 'bg-primary/20 border-primary shadow-card'
                  : 'bg-secondary/60 border-border hover:bg-secondary/80'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 mr-3 rounded-md overflow-hidden flex-shrink-0 border border-border">
                {asset.src ? (
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <PlusCircle size={20} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="font-medium truncate">{asset.name}</div>
                {asset.category && (
                  <div className="text-sm text-muted-foreground">{asset.category}</div>
                )}
              </div>

              {/* Selection indicator */}
              {isAssetSelected(asset) && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Star size={12} className="text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}