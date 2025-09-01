import React from 'react';
import { ChevronLeft, ChevronRight, Download, Share, Heart, RotateCcw } from 'lucide-react';
import { useImageGenStudioStore } from '@/store/imageGenStudioStore';
import { useAppStore } from '@/store/appStore';

export function ImageCarouselPanel() {
  const {
    generatedImages,
    selectedImageIndex,
    setSelectedImageIndex
  } = useImageGenStudioStore();

  const { saveToAIGallery } = useAppStore();

  if (generatedImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center mb-4">
          <Heart size={32} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Generated Images</h3>
        <p className="text-sm">Generate your first image using the selected assets</p>
      </div>
    );
  }

  const currentImage = generatedImages[selectedImageIndex];

  const nextImage = () => {
    setSelectedImageIndex((selectedImageIndex + 1) % generatedImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((selectedImageIndex - 1 + generatedImages.length) % generatedImages.length);
  };

  const handleSaveToGallery = async () => {
    if (!currentImage) return;
    
    try {
      await saveToAIGallery(currentImage, {
        prompt: 'Generated in ImageGen Studio',
        model: 'Gemini Nano',
        parameters: {},
        category: currentImage.category || 'generated'
      });
    } catch (error) {
      console.error('Failed to save to gallery:', error);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = currentImage.name || 'generated-image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Generated Images</h2>
        <div className="text-sm text-muted-foreground">
          {selectedImageIndex + 1} of {generatedImages.length}
        </div>
      </div>

      {/* Main Image Display */}
      <div className="relative bg-card/30 rounded-xl p-4 shadow-card border border-border">
        <div className="flex justify-center items-center">
          <img
            src={currentImage.src}
            alt="Generated content"
            className="h-72 object-contain rounded-lg shadow-pipeline"
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex space-x-2">
          <button 
            onClick={handleSaveToGallery}
            className="p-2 bg-background/40 backdrop-blur-sm rounded-full hover:bg-background/60 transition-colors border border-border"
          >
            <Heart size={16} className="text-muted-foreground hover:text-primary" />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 bg-background/40 backdrop-blur-sm rounded-full hover:bg-background/60 transition-colors border border-border"
          >
            <Download size={16} className="text-muted-foreground hover:text-primary" />
          </button>
          <button className="p-2 bg-background/40 backdrop-blur-sm rounded-full hover:bg-background/60 transition-colors border border-border">
            <Share size={16} className="text-muted-foreground hover:text-primary" />
          </button>
          <button className="p-2 bg-background/40 backdrop-blur-sm rounded-full hover:bg-background/60 transition-colors border border-border">
            <RotateCcw size={16} className="text-muted-foreground hover:text-primary" />
          </button>
        </div>

        {/* Navigation Arrows */}
        {generatedImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-sm p-2 rounded-full hover:bg-background/60 transition-all hover:scale-110 border border-border"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/40 backdrop-blur-sm p-2 rounded-full hover:bg-background/60 transition-all hover:scale-110 border border-border"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {generatedImages.length > 1 && (
        <div className="flex justify-center space-x-3 overflow-x-auto py-3 px-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {generatedImages.map((image, index) => (
            <div
              key={image.id}
              className={`cursor-pointer rounded-md overflow-hidden transition-all flex-shrink-0 ${
                selectedImageIndex === index 
                  ? 'border-2 border-primary shadow-card scale-105' 
                  : 'border border-border opacity-70 hover:opacity-100'
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={image.src}
                alt={`Thumbnail ${index + 1}`}
                className="h-16 w-24 object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}