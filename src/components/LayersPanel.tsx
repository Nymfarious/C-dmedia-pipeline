import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, Move } from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  type: 'background' | 'image' | 'text' | 'shape';
  visible: boolean;
  locked: boolean;
  opacity: number;
}

interface LayersPanelProps {
  activeTab: string;
}

export function LayersPanel({ activeTab }: LayersPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', name: 'Background', type: 'background', visible: true, locked: false, opacity: 100 },
    { id: '2', name: 'Main Image', type: 'image', visible: true, locked: false, opacity: 100 },
    { id: '3', name: 'Text Layer', type: 'text', visible: true, locked: false, opacity: 85 },
  ]);

  const [selectedLayer, setSelectedLayer] = useState('2');

  const toggleVisibility = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggleLock = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const updateOpacity = (id: string, opacity: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    ));
  };

  const deleteLayer = (id: string) => {
    if (layers.length > 1) {
      setLayers(layers.filter(layer => layer.id !== id));
      if (selectedLayer === id) {
        setSelectedLayer(layers.find(l => l.id !== id)?.id || '');
      }
    }
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'background': return '🖼️';
      case 'image': return '🖼️';
      case 'text': return '📝';
      case 'shape': return '🔷';
      default: return '📄';
    }
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Layers</h3>
        <button 
          className="p-1 hover:bg-muted rounded-md"
          title="Add Layer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`group p-2 rounded-md border cursor-pointer transition-colors ${
              selectedLayer === layer.id 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:bg-muted'
            }`}
            onClick={() => setSelectedLayer(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div className="mr-2 text-sm">{getLayerIcon(layer.type)}</div>
                <span className="text-sm font-medium truncate">{layer.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {layer.visible ? 
                    <Eye className="h-3 w-3" /> : 
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  }
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {layer.locked ? 
                    <Lock className="h-3 w-3 text-muted-foreground" /> : 
                    <Unlock className="h-3 w-3" />
                  }
                </button>

                {layer.type !== 'background' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="p-1 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
            </div>

            {selectedLayer === layer.id && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span>Opacity</span>
                  <span>{layer.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity}
                  onChange={(e) => updateOpacity(layer.id, parseInt(e.target.value))}
                  className="w-full mt-1 accent-primary"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <button className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center justify-center">
          <Plus className="mr-1 h-4 w-4" />
          Add Layer
        </button>
      </div>
    </div>
  );
}