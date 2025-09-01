import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Search, Check, Image, Film, Music } from "lucide-react";
import useAppStore from "@/store/appStore";
import { Asset } from "@/types/media";
import { cn } from "@/lib/utils";

interface AssetImportModalProps {
  onImport: (asset: Asset) => void;
  triggerText?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AssetImportModal = ({ onImport, triggerText = "Import Asset", isOpen: externalIsOpen, onClose: externalOnClose }: AssetImportModalProps) => {
  const { assets, allCategories } = useAppStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose !== undefined ? externalOnClose : setInternalIsOpen;

  const assetArray = Object.values(assets);

  const filteredAssets = assetArray.filter(asset => {
    const matchesSearch = !searchQuery || asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleImport = () => {
    if (selectedAssetId) {
      const asset = assets[selectedAssetId];
      if (asset) {
        onImport(asset);
        if (externalOnClose) {
          externalOnClose();
        } else {
          setInternalIsOpen(false);
        }
        setSelectedAssetId(null);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'animation': return <Film className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'animation': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'audio': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={externalOnClose || setInternalIsOpen}>
      {!externalIsOpen && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Asset</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No assets found</p>
              <p className="text-sm">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
                    selectedAssetId === asset.id 
                      ? "ring-2 ring-primary shadow-md bg-primary/5" 
                      : "hover:border-primary/50"
                  )}
                  onClick={() => setSelectedAssetId(asset.id)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Asset Preview */}
                      <div className="aspect-square rounded-md overflow-hidden bg-muted relative">
                        <img
                          src={asset.src}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedAssetId === asset.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Asset Info */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs border", getTypeColor(asset.type))}
                          >
                            {getTypeIcon(asset.type)}
                            {asset.type}
                          </Badge>
                          {asset.category && (
                            <Badge variant="secondary" className="text-xs">
                              {asset.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedAssetId ? `Selected: ${assets[selectedAssetId]?.name}` : 'Select an asset to import'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              if (externalOnClose) {
                externalOnClose();
              } else {
                setInternalIsOpen(false);
              }
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedAssetId}
            >
              Import Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};