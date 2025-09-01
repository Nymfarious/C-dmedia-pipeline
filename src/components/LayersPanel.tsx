import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, Move, Image as ImageIcon, Type, Square } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';
import { toast } from 'sonner';

interface Layer {
  id: string;
  name: string;
  type: 'background' | 'image' | 'text' | 'shape';
  visible: boolean;
  locked: boolean;
  opacity: number;
  assetId?: string;
  asset?: Asset;
  zIndex: number;
}

interface LayersPanelProps {
  activeTab: string;
}

export function LayersPanel({ activeTab }: LayersPanelProps) {
  const { getActiveCanvasWithAsset, assets, persist } = useAppStore();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('');

  // Initialize layers from active canvas
  useEffect(() => {
    const activeCanvas = getActiveCanvasWithAsset();
    if (activeCanvas?.asset) {
      const backgroundLayer: Layer = {
        id: 'background',
        name: 'Background',
        type: 'background',
        visible: true,
        locked: false,
        opacity: 100,
        zIndex: 0
      };

      const assetLayer: Layer = {
        id: `asset-${activeCanvas.asset.id}`,
        name: activeCanvas.asset.name || 'Main Image',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 100,
        assetId: activeCanvas.asset.id,
        asset: activeCanvas.asset,
        zIndex: 1
      };

      setLayers([backgroundLayer, assetLayer]);
      setSelectedLayer(assetLayer.id);
    } else {
      // Default layers when no canvas is active
      setLayers([
        { id: '1', name: 'Background', type: 'background', visible: true, locked: false, opacity: 100, zIndex: 0 },
      ]);
      setSelectedLayer('1');
    }
  }, [getActiveCanvasWithAsset]);

  // Auto-save when layers change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      persist();
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [layers, persist]);

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
      case 'background': return <Square className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'shape': return <Square className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  const addLayerFromAsset = (asset: Asset) => {
    const newLayer: Layer = {
      id: `asset-${asset.id}-${Date.now()}`,
      name: asset.name || 'New Asset',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 100,
      assetId: asset.id,
      asset: asset,
      zIndex: layers.length
    };

    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    toast.success(`Added ${asset.name} as new layer`);
  };

  const addNewLayer = (type: 'text' | 'shape' | 'image' = 'image') => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      type,
      visible: true,
      locked: false,
      opacity: 100,
      zIndex: layers.length
    };

    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
    toast.success(`Added new ${type} layer`);
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;

    const newLayers = [...layers];
    const targetIndex = direction === 'up' ? layerIndex + 1 : layerIndex - 1;
    
    if (targetIndex >= 0 && targetIndex < newLayers.length) {
      // Swap positions
      [newLayers[layerIndex], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[layerIndex]];
      
      // Update z-indices
      newLayers.forEach((layer, index) => {
        layer.zIndex = index;
      });
      
      setLayers(newLayers);
      toast.success(`Moved layer ${direction}`);
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
        {layers
          .sort((a, b) => b.zIndex - a.zIndex) // Display highest z-index first (top layer)
          .map((layer, displayIndex) => (
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
                <div className="mr-2 text-primary">{getLayerIcon(layer.type)}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{layer.name}</span>
                  {layer.asset && (
                    <span className="text-xs text-muted-foreground truncate block">
                      {layer.asset.meta?.width && layer.asset.meta?.height && 
                        `${layer.asset.meta.width}×${layer.asset.meta.height}`
                      }
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* Move buttons */}
                {displayIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                
                {displayIndex < layers.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Toggle visibility"
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
                  title="Toggle lock"
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
                    title="Delete layer"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
            </div>

            {selectedLayer === layer.id && (
              <div className="mt-2 pt-2 border-t border-border space-y-2">
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
                  className="w-full accent-primary"
                />
                
                {layer.asset && (
                  <div className="mt-2">
                    <div className="aspect-video w-full bg-muted rounded overflow-hidden">
                      <img 
                        src={layer.asset.src} 
                        alt={layer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border space-y-2">
        <button 
          onClick={() => addNewLayer('image')}
          className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm flex items-center justify-center"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Image Layer
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => addNewLayer('text')}
            className="py-1 px-2 bg-secondary text-secondary-foreground rounded text-xs flex items-center justify-center hover:bg-secondary/80"
          >
            <Type className="mr-1 h-3 w-3" />
            Text
          </button>
          <button 
            onClick={() => addNewLayer('shape')}
            className="py-1 px-2 bg-secondary text-secondary-foreground rounded text-xs flex items-center justify-center hover:bg-secondary/80"
          >
            <Square className="mr-1 h-3 w-3" />
            Shape
          </button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Drag assets from gallery to add as layers
        </div>
      </div>
    </div>
  );
}