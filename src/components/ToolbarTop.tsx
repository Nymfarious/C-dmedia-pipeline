import React, { useState, Fragment } from 'react';
import {
  MousePointerIcon,
  ScissorsIcon,
  Wand2,
  ImageIcon,
  LayersIcon,
  PanelRightIcon,
  PanelLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  SparklesIcon,
  Trash,
  TypeIcon,
  MoveIcon,
  SlidersIcon,
  PaintbrushIcon,
  BrushIcon,
  EraserIcon,
  ShapesIcon,
  CropIcon,
  Smile,
  Edit3,
} from 'lucide-react';

interface ToolbarTopProps {
  activeTab: string;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  toggleRightPanel: () => void;
  onOpenAIModal?: () => void;
}

export function ToolbarTop({
  activeTab,
  selectedTool,
  onToolChange,
  toggleRightPanel,
  onOpenAIModal,
}: ToolbarTopProps) {
  const [activeTool, setActiveTool] = useState('select');
  const [toolbarExpanded, setToolbarExpanded] = useState(true);

  const handleToolClick = (tool: string) => {
    setActiveTool(tool);
    onToolChange(tool);
    
    // Open AI modal for AI generation tool
    if (tool === 'smart-select' && onOpenAIModal) {
      onOpenAIModal();
    }
  };

  const toolGroups = [
    {
      title: 'Selection',
      tools: [
        {
          id: 'select',
          icon: <MousePointerIcon size={18} />,
          tooltip: 'Select',
        },
        {
          id: 'smart-select',
          icon: <Wand2 size={18} />,
          tooltip: 'AI Generation',
        },
        {
          id: 'lasso',
          icon: <ShapesIcon size={18} />,
          tooltip: 'Lasso Selection',
        },
      ],
    },
    {
      title: 'Draw',
      tools: [
        {
          id: 'brush',
          icon: <PaintbrushIcon size={18} />,
          tooltip: 'Paintbrush',
        },
        {
          id: 'eraser',
          icon: <EraserIcon size={18} />,
          tooltip: 'Eraser',
        },
        {
          id: 'colors',
          icon: <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-blue-500 rounded-full" />,
          tooltip: 'Color & Style',
        },
      ],
    },
    {
      title: 'Transform',
      tools: [
        {
          id: 'crop',
          icon: <CropIcon size={18} />,
          tooltip: 'Crop',
        },
        {
          id: 'rotate',
          icon: <RotateCwIcon size={18} />,
          tooltip: 'Rotate',
        },
        {
          id: 'resize',
          icon: <MoveIcon size={18} />,
          tooltip: 'Resize',
        },
      ],
    },
    {
      title: 'AI Tools',
      tools: [
        {
          id: 'inpaint',
          icon: <Edit3 size={18} />,
          tooltip: 'AI Inpainting',
        },
        {
          id: 'remove-bg',
          icon: <Trash size={18} />,
          tooltip: 'Remove Background',
        },
        {
          id: 'enhance',
          icon: <SparklesIcon size={18} />,
          tooltip: 'AI Enhance',
        },
        {
          id: 'style',
          icon: <Wand2 size={18} />,
          tooltip: 'Style Transfer',
        },
      ],
    },
    {
      title: 'Edit',
      tools: [
        {
          id: 'text',
          icon: <TypeIcon size={18} />,
          tooltip: 'Add Text',
        },
        {
          id: 'stickers',
          icon: <Smile size={18} />,
          tooltip: 'Stickers & Emoji',
        },
        {
          id: 'adjust',
          icon: <SlidersIcon size={18} />,
          tooltip: 'Adjustments',
        },
      ],
    },
  ];

  return (
    <div className="bg-card border-b border-border flex flex-col">
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {toolGroups.map((group, index) => (
            <Fragment key={group.title}>
              {index > 0 && <div className="h-8 w-px bg-border mx-1"></div>}
              <div className="flex items-center">
                {group.tools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`p-2 rounded-md hover:bg-muted relative group transition-colors ${
                      activeTool === tool.id ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => handleToolClick(tool.id)}
                    title={tool.tooltip}
                  >
                    {tool.icon}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-0.5 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {tool.tooltip}
                    </span>
                  </button>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-md hover:bg-muted" title="Zoom In">
            <ZoomInIcon size={18} />
          </button>
          <button
            className="p-2 rounded-md hover:bg-muted"
            title="Zoom Out"
          >
            <ZoomOutIcon size={18} />
          </button>
          <div className="h-8 w-px bg-border mx-1"></div>
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={toggleRightPanel}
            title="Toggle Panels"
          >
            <PanelRightIcon size={18} />
          </button>
        </div>
      </div>
      {toolbarExpanded && activeTool === 'brush' && (
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs mb-1">Size</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  defaultValue="12"
                  className="w-32 accent-primary"
                />
                <span className="text-xs">12px</span>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Opacity</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  defaultValue="100"
                  className="w-32 accent-primary"
                />
                <span className="text-xs">100%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Hardness</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-32 accent-primary"
                />
                <span className="text-xs">50%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-3">
              <label className="block text-xs mb-1">Color</label>
              <div className="flex items-center space-x-1">
                {[
                  '#ffffff',
                  '#ff0000',
                  '#00ff00',
                  '#0000ff',
                  '#ffff00',
                  '#ff00ff',
                ].map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-full border border-border"
                    style={{
                      backgroundColor: color,
                    }}
                  />
                ))}
                <button className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border border-border" />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Brush Type</label>
              <select className="bg-muted border border-border rounded px-2 py-1 text-xs">
                <option>Soft Round</option>
                <option>Hard Round</option>
                <option>Airbrush</option>
                <option>Texture</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}