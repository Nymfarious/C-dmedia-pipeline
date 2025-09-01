import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Search, Image, Music, Film, Check, CheckSquare, Square, Download, FolderPlus, Sparkles, Edit, MoreVertical, Trash2, Plus, Crop, Palette } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { MediaType, Asset, DEFAULT_CATEGORIES } from '@/types/media';
import { cn } from '@/lib/utils';
import { downloadBlob, fetchBlobFromUrl, getFileExtensionFromBlob } from '@/lib/download';
import { toast } from 'sonner';
import { CategoryManagement } from "./CategoryManagement";
import { SimplifiedAIModal } from "./SimplifiedAIModal";

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

interface AssetsPageProps {
  onSelectImage?: () => void;
}

export function AssetsPage({ onSelectImage }: AssetsPageProps) {
  const { 
    assets, 
    selectedAssetIds, 
    setSelected, 
    addAssets, 
    exportAssets, 
    updateAssetCategory, 
    allCategories, 
    createCanvas, 
    setActiveCanvas, 
    deleteAssets,
    persist
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      persist();
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(saveInterval);
  }, [persist]);

  const assetArray = Object.values(assets);
  
  const filteredAssets = assetArray
    .filter(asset => {
      if (filterType !== 'all' && asset.type !== filterType) return false;
      if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && asset.subcategory !== subcategoryFilter) return false;
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'type': return a.type.localeCompare(b.type);
        case 'date':
        default: return b.createdAt - a.createdAt;
      }
    });

  const availableSubcategories = categoryFilter === 'all' 
    ? []
    : allCategories.find(cat => cat.id === categoryFilter)?.subcategories || [];

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
    toast.success(`Uploaded ${newAssets.length} asset${newAssets.length > 1 ? 's' : ''} - Auto-saved!`);
    
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

  const handleBatchDelete = async () => {
    if (selectedAssetIds.length === 0) return;
    
    try {
      deleteAssets(selectedAssetIds);
      setSelected([]);
      toast.success(`Deleted ${selectedAssetIds.length} asset${selectedAssetIds.length > 1 ? 's' : ''} - Auto-saved!`);
    } catch (error) {
      toast.error('Failed to delete assets');
      console.error('Delete error:', error);
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

  const handleCategoryChange = async (assetId: string, categoryId: string, subcategory?: string) => {
    updateAssetCategory(assetId, categoryId, subcategory);
    await persist(); // Auto-save immediately after category change
    toast.success('Category updated - Auto-saved!');
  };

  return (
    <div className="h-full bg-background flex flex-col">
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
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Assets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your uploaded assets and AI generations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <CategoryManagement />
            
            <Button 
              variant="outline" 
              onClick={() => setIsGenerationModalOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleUpload}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            
            {selectedAssetIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default">
                    Actions ({selectedAssetIds.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBatchExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleBatchDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'type') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter('all');
            }}>
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

            {availableSubcategories.length > 0 && (
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="w-48">
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
            
            <div className="flex-1" />
            
            {Object.keys(assets).length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearSelection}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selection Info */}
        {selectedAssetIds.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              {selectedAssetIds.length} asset{selectedAssetIds.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group",
                selectedAssetIds.includes(asset.id) 
                  ? "ring-2 ring-primary shadow-lg bg-primary/5" 
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            const canvasId = createCanvas('image', asset);
                            setActiveCanvas(canvasId);
                            toast.success(`Opened ${asset.name} in canvas`);
                            onSelectImage?.();
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Open in Canvas
                        </DropdownMenuItem>
                        {allCategories.map((category) => (
                          <DropdownMenuItem 
                            key={category.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryChange(asset.id, category.id, category.subcategories[0]);
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
                  
                  {asset.category && (
                    <Badge variant="secondary" className="text-xs">
                      {allCategories.find(c => c.id === asset.category)?.name || asset.category}
                    </Badge>
                  )}
                  
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
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Image className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-3">No assets found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchQuery 
                ? 'Try adjusting your search query or filters' 
                : 'Upload some assets or generate new ones to get started'
              }
            </p>
            <div className="flex gap-3">
              <Button onClick={handleUpload} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Assets
              </Button>
              <Button onClick={() => setIsGenerationModalOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Assets
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Generation Modal */}
      <SimplifiedAIModal
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
      />
    </div>
  );
}