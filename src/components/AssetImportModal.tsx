import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAppStore from "@/store/appStore";
import { Asset, MediaType } from "@/types/media";
import { Search, Image, Play, Volume2, Clock, Star } from "lucide-react";
import { format } from "date-fns";

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (asset: Asset) => void;
  allowMultiple?: boolean;
}

export const AssetImportModal = ({ isOpen, onClose, onImport, allowMultiple = false }: AssetImportModalProps) => {
  const { assets, selectedAssetIds, setSelected, allCategories } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Get available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (categoryFilter === 'all') return [];
    const category = allCategories.find(cat => cat.name === categoryFilter);
    return category?.subcategories || [];
  }, [categoryFilter, allCategories]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return Object.values(assets)
      .filter(asset => {
        if (filterType !== 'all' && asset.type !== filterType) return false;
        if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
        if (subcategoryFilter !== 'all' && asset.subcategory !== subcategoryFilter) return false;
        if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assets, filterType, categoryFilter, subcategoryFilter, searchQuery]);

  const handleAssetClick = (asset: Asset) => {
    if (allowMultiple) {
      const newSelected = new Set(selectedAssets);
      if (newSelected.has(asset.id)) {
        newSelected.delete(asset.id);
      } else {
        newSelected.add(asset.id);
      }
      setSelectedAssets(newSelected);
    } else {
      onImport(asset);
      onClose();
    }
  };

  const handleImportSelected = () => {
    if (!allowMultiple || selectedAssets.size === 0) return;
    
    selectedAssets.forEach(assetId => {
      const asset = assets[assetId];
      if (asset) onImport(asset);
    });
    
    setSelectedAssets(new Set());
    onClose();
  };

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'animation': return <Play className="h-4 w-4" />;
      case 'audio': return <Volume2 className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Assets to Canvas</DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as MediaType | 'all')} className="flex-1">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="animation">Animations</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(category => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableSubcategories.length > 0 && (
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {availableSubcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Asset Grid */}
        <ScrollArea className="flex-1">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assets found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={allowMultiple && selectedAssets.has(asset.id)}
                  onClick={() => handleAssetClick(asset)}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {allowMultiple && (
          <div className="border-t pt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleImportSelected} 
                disabled={selectedAssets.size === 0}
              >
                Import Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
  getTypeIcon: (type: MediaType) => React.ReactNode;
}

const AssetCard = ({ asset, isSelected, onClick, getTypeIcon }: AssetCardProps) => {
  return (
    <div
      className={`group relative bg-card rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-card ${
        isSelected ? 'ring-2 ring-primary shadow-card' : ''
      }`}
      onClick={onClick}
    >
      {/* Asset Preview */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {asset.type === 'image' ? (
          <img
            src={asset.src}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-secondary">
            {getTypeIcon(asset.type)}
          </div>
        )}
        
        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
        )}
      </div>

      {/* Asset Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(asset.type)}
          <h3 className="font-medium truncate flex-1">{asset.name}</h3>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(asset.createdAt), 'MMM d')}
          </span>
          {asset.meta?.width && asset.meta?.height && (
            <span>{asset.meta.width}×{asset.meta.height}</span>
          )}
        </div>
        
        {(asset.category || asset.subcategory) && (
          <div className="flex flex-wrap gap-1">
            {asset.category && (
              <Badge variant="outline" className="text-xs">{asset.category}</Badge>
            )}
            {asset.subcategory && (
              <Badge variant="secondary" className="text-xs">{asset.subcategory}</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};