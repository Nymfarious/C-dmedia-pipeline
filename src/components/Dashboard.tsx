import { useState } from 'react';
import { Asset } from '@/types/media';
import { Header } from '@/components/Header';
import { Toolbar } from '@/components/Toolbar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterWorkspace } from '@/components/CenterWorkspace';

export function Dashboard() {
  const [canvases, setCanvases] = useState<Array<{
    id: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    asset?: Asset;
    createdAt: number;
  }>>([]);
  
  const [activeCanvas, setActiveCanvas] = useState<string | null>(null);

  const createCanvas = (type: 'image' | 'video' | 'audio') => {
    const newCanvas = {
      id: crypto.randomUUID(),
      type,
      name: `New ${type} canvas`,
      createdAt: Date.now(),
    };
    
    setCanvases(prev => [...prev, newCanvas]);
    setActiveCanvas(newCanvas.id);
  };

  const updateCanvasAsset = (canvasId: string, asset: Asset) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId 
        ? { ...canvas, asset }
        : canvas
    ));
  };

  const currentCanvas = canvases.find(c => c.id === activeCanvas);

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <Header />
      
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <LeftSidebar 
          canvases={canvases}
          activeCanvas={activeCanvas}
          onCreateCanvas={createCanvas}
          onSelectCanvas={setActiveCanvas}
        />
        
        {/* Center Workspace */}
        <CenterWorkspace 
          currentCanvas={currentCanvas}
          onCanvasAssetUpdate={updateCanvasAsset}
          onCreateCanvas={createCanvas}
        />
        
        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}