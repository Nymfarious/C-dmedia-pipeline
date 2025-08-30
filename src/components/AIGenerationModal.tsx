import React, { useState } from 'react';
import { X, SparklesIcon, ImageIcon, Settings, Wand2 } from 'lucide-react';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: { prompt: string; style: string; quality: string }) => void;
}

export function AIGenerationModal({ isOpen, onClose, onGenerate }: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [quality, setQuality] = useState('high');

  if (!isOpen) return null;

  const styles = [
    { id: 'photorealistic', name: 'Photorealistic', preview: '/api/placeholder/80/80' },
    { id: 'cinematic', name: 'Cinematic', preview: '/api/placeholder/80/80' },
    { id: 'anime', name: 'Anime', preview: '/api/placeholder/80/80' },
    { id: 'digital-art', name: 'Digital Art', preview: '/api/placeholder/80/80' },
    { id: 'oil-painting', name: 'Oil Painting', preview: '/api/placeholder/80/80' },
    { id: 'watercolor', name: 'Watercolor', preview: '/api/placeholder/80/80' },
  ];

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate({ prompt, style: selectedStyle, quality });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center">
            <SparklesIcon className="mr-2 h-5 w-5 text-primary" />
            AI Image Generation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="w-full h-24 px-3 py-2 bg-muted border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <div className="grid grid-cols-3 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border text-center hover:bg-muted transition-colors ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <div className="w-full h-16 bg-muted rounded-md mb-2 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-xs font-medium">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-muted rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}