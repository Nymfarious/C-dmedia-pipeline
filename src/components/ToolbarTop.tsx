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
  VideoIcon,
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

import { Button } from '@/components/ui/button';
import useAppStore from '@/store/appStore';

interface ToolbarTopProps {
  activeTab: string;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  toggleRightPanel: () => void;
}

export function ToolbarTop({
  activeTab,
  selectedTool,
  onToolChange,
  toggleRightPanel,
}: ToolbarTopProps) {
  const [toolbarExpanded, setToolbarExpanded] = useState(true);
  const { setActiveTool } = useAppStore();

  const handleToolClick = (tool: string) => {
    // Only allow clicks on working tools
    const toolData = essentialTools.find(t => t.id === tool) || advancedTools.find(t => t.id === tool);
    if (!toolData?.working) return;
    
    // Toggle tool if clicking same tool
    if (selectedTool === tool) {
      onToolChange('select');
      setActiveTool('select');
      return;
    }
    
    onToolChange(tool);
    
    // Activate tools in the store
    if (tool === 'inpaint') {
      setActiveTool('inpaint');
    } else if (tool === 'smart-select') {
      setActiveTool('smart-select');
    } else if (tool === 'video') {
      setActiveTool('video');
    } else if (tool === 'text') {
      setActiveTool('text');
    } else {
      setActiveTool(tool);
    }
  };

  // Essential tools - always visible
  const essentialTools = [
    {
      id: 'select',
      icon: <MousePointerIcon size={18} />,
      tooltip: 'Select',
      working: true,
    },
    {
      id: 'smart-select',
      icon: <SparklesIcon size={18} />,
      tooltip: 'AI Generation',
      working: true,
    },
    {
      id: 'video',
      icon: <VideoIcon size={18} />,
      tooltip: 'Video Generation',
      working: true,
    },
    {
      id: 'crop',
      icon: <CropIcon size={18} />,
      tooltip: 'Crop',
      working: true,
    },
    {
      id: 'inpaint',
      icon: <Edit3 size={18} />,
      tooltip: 'AI Inpainting',
      working: true,
    },
  ];

  // Advanced tools - in collapsible section
  const advancedTools = [
    {
      id: 'brush',
      icon: <PaintbrushIcon size={18} />,
      tooltip: 'Paintbrush',
      working: true,
    },
    {
      id: 'remove-bg',
      icon: <Trash size={18} />,
      tooltip: 'Remove Background',
      working: true,
    },
    {
      id: 'text',
      icon: <TypeIcon size={18} />,
      tooltip: 'Add Text with AI',
      working: true,
    },
  ];

  return (
    <div className="bg-card border-b border-border flex flex-col">
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Essential Tools */}
          <div className="flex items-center">
            {essentialTools.map((tool) => (
              <button
                key={tool.id}
                className={`p-2 rounded-md relative group transition-colors hover:bg-muted ${
                  selectedTool === tool.id ? 'bg-primary/10 text-primary' : ''
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
          
          <div className="h-8 w-px bg-border mx-1"></div>
          
          {/* Advanced Tools - Collapsible */}
          <details className="relative">
            <summary className="p-2 rounded-md hover:bg-muted cursor-pointer flex items-center gap-1 text-sm text-muted-foreground">
              More Tools
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-1 flex">
              {advancedTools.map((tool) => (
                <button
                  key={tool.id}
                  className={`p-2 rounded-md relative group transition-colors hover:bg-muted ${
                    selectedTool === tool.id ? 'bg-primary/10 text-primary' : ''
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
          </details>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-md hover:bg-muted" title="Zoom In">
            <ZoomInIcon size={18} />
          </button>
          <button className="p-2 rounded-md hover:bg-muted" title="Zoom Out">
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
      {toolbarExpanded && selectedTool === 'brush' && (
        <div className="px-4 py-2 border-t border-border flex flex-wrap items-center gap-4 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <div>
              <label className="block text-xs mb-1">Size</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  defaultValue="12"
                  className="w-24 sm:w-32 accent-primary"
                />
                <span className="text-xs whitespace-nowrap">12px</span>
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
                  className="w-24 sm:w-32 accent-primary"
                />
                <span className="text-xs whitespace-nowrap">100%</span>
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
                  className="w-24 sm:w-32 accent-primary"
                />
                <span className="text-xs whitespace-nowrap">50%</span>
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