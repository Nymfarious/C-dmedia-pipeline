import React, { useState } from 'react';
import { LayersPanel } from './LayersPanel';
import { HistoryPanel } from './HistoryPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { LayersIcon, HistoryIcon, SettingsIcon, ImageIcon } from 'lucide-react';
interface RightPanelProps {
  activeTab: string;
  history: any[];
  historyIndex: number;
}
export function RightPanel({
  activeTab,
  history,
  historyIndex
}: RightPanelProps) {
  const [activePanel, setActivePanel] = useState('layers');
  return <div className="w-64 bg-card border-l border-border flex flex-col">
      <div className="flex border-b border-border">
        <button className={`flex-1 py-2 text-center transition-colors ${activePanel === 'layers' ? 'border-b-2 border-primary bg-primary/5' : 'hover:bg-muted'}`} onClick={() => setActivePanel('layers')}>
          <LayersIcon size={16} className="inline-block mr-1" />
          <span className="text-sm">Layers</span>
        </button>
        
      </div>
      <div className="flex border-b border-border">
        <button className={`flex-1 py-2 text-center transition-colors ${activePanel === 'history' ? 'border-b-2 border-primary bg-primary/5' : 'hover:bg-muted'}`} onClick={() => setActivePanel('history')}>
          <HistoryIcon size={16} className="inline-block mr-1" />
          <span className="text-sm">History</span>
        </button>
        <button className={`flex-1 py-2 text-center transition-colors ${activePanel === 'properties' ? 'border-b-2 border-primary bg-primary/5' : 'hover:bg-muted'}`} onClick={() => setActivePanel('properties')}>
          <SettingsIcon size={16} className="inline-block mr-1" />
          <span className="text-sm">Properties</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'layers' && <LayersPanel activeTab={activeTab} />}
        {activePanel === 'assets' && <AssetLibraryPanel />}
        {activePanel === 'history' && <HistoryPanel history={history} historyIndex={historyIndex} />}
        {activePanel === 'properties' && <PropertiesPanel activeTab={activeTab} />}
      </div>
    </div>;
}