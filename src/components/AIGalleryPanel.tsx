import React, { useState } from 'react';
import { ArrowLeft, Download, Star, StarOff, Grid, List, Search } from 'lucide-react';

interface AIGalleryPanelProps {
  onSelectImage: (image: any) => void;
}

export function AIGalleryPanel({ onSelectImage }: AIGalleryPanelProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'portraits', name: 'Portraits' },
    { id: 'landscapes', name: 'Landscapes' },
    { id: 'abstract', name: 'Abstract' },
    { id: 'animals', name: 'Animals' },
  ];

  const [images, setImages] = useState([
    { id: '1', prompt: 'Mountain landscape at sunset', favorite: true, category: 'landscapes', created: '2 hours ago' },
    { id: '2', prompt: 'Abstract digital art with vibrant colors', favorite: false, category: 'abstract', created: '1 day ago' },
    { id: '3', prompt: 'Portrait of a person in cinematic style', favorite: true, category: 'portraits', created: '3 days ago' },
    { id: '4', prompt: 'Cute cat sitting in a garden', favorite: false, category: 'animals', created: '1 week ago' },
  ]);

  const filteredImages = images.filter(image => {
    const matchesSearch = image.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    setImages(images.map(image => 
      image.id === id ? { ...image, favorite: !image.favorite } : image
    ));
  };

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => onSelectImage(null)}
              className="p-2 hover:bg-muted rounded-md mr-3"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">AI Gallery</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your AI generations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">No generations found</h3>
            <p className="text-muted-foreground">Try adjusting your search or create some AI art!</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`group border border-border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center p-4' : ''
                }`}
                onClick={() => onSelectImage(image)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-muted flex items-center justify-center relative">
                      <div className="text-4xl">🖼️</div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(image.id);
                          }}
                          className="p-1 bg-background/80 hover:bg-background rounded-full transition-colors"
                        >
                          {image.favorite ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                          className="p-1 bg-background/80 hover:bg-background rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-2 mb-1">{image.prompt}</p>
                      <p className="text-xs text-muted-foreground">{image.created}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mr-4">
                      <div className="text-2xl">🖼️</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{image.prompt}</p>
                      <p className="text-sm text-muted-foreground">{image.created}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(image.id);
                        }}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        {image.favorite ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download
                        }}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}