import React from 'react';
import {
  ImageIcon,
  VideoIcon,
  MusicIcon,
  SparklesIcon,
  BookmarkIcon,
  PlusCircleIcon,
} from 'lucide-react';
import useAppStore from '@/store/appStore';
import type { Asset } from '@/types/media';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { assets, createCanvas, setActiveCanvas } = useAppStore();
  
  const tabs = [
    {
      id: 'image',
      label: 'Image Canvas',
      icon: <ImageIcon size={20} />,
      description: 'Generate, edit, enhance',
    },
    {
      id: 'video',
      label: 'Video Canvas',
      icon: <VideoIcon size={20} />,
      description: 'Image to video, animate',
    },
    {
      id: 'audio',
      label: 'Audio Canvas',
      icon: <MusicIcon size={20} />,
      description: 'Text to speech, sound FX',
    },
  ];

  const quickLinks = [
    {
      id: 'ai-gallery',
      label: 'AI Gallery',
      icon: <SparklesIcon size={18} />,
      description: 'Your AI generations',
    },
    {
      id: 'saved',
      label: 'Saved Projects',
      icon: <BookmarkIcon size={18} />,
      description: 'Your saved work',
    },
  ];
  
  // Get real recent projects from assets
  const recentProjects = Object.values(assets)
    .sort((a: Asset, b: Asset) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map((asset: Asset) => ({
      id: asset.id,
      name: asset.name,
      date: new Date(asset.createdAt).toLocaleDateString(),
      type: asset.type,
      src: asset.src,
      asset: asset,
      category: asset.category,
    }));

  const handleProjectClick = (project: any) => {
    // Load the asset to a new canvas
    const canvasId = createCanvas(project.type as 'image' | 'video' | 'audio', project.asset);
    setActiveCanvas(canvasId);
    // Switch to the appropriate tab
    onTabChange(project.type);
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col">
      <div className="p-4">
        <h2 className="font-medium text-sm text-muted-foreground mb-2">
          Create Canvas
        </h2>
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-start w-full p-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary/10 border border-primary' 
                  : 'hover:bg-muted border border-transparent'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="mr-3 mt-0.5">{tab.icon}</div>
              <div>
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs text-muted-foreground">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <h2 className="font-medium text-sm text-muted-foreground mb-2">
            Quick Access
          </h2>
          <div className="space-y-1">
            {quickLinks.map((link) => (
              <button
                key={link.id}
                className="flex items-start w-full p-2 rounded-lg text-left hover:bg-muted transition-colors"
                onClick={() => onTabChange(link.id)}
              >
                <div className="mr-2 mt-0.5 text-primary">{link.icon}</div>
                <div>
                  <div className="font-medium text-sm">{link.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 p-4 border-t border-border flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-muted-foreground">Recent Projects</h2>
          <button className="p-1 rounded-full hover:bg-muted text-primary">
            <PlusCircleIcon size={16} />
          </button>
        </div>
        <div className="space-y-1">
          {recentProjects.length > 0 ? recentProjects.map((project) => (
            <button
              key={project.id}
              className="flex items-start w-full p-2 rounded-lg text-left hover:bg-muted group transition-colors"
              onClick={() => handleProjectClick(project)}
            >
              <div className="mr-2 mt-0.5">
                {project.type === 'image' && (
                  project.src ? (
                    <img 
                      src={project.src} 
                      alt={project.name}
                      className="w-5 h-5 rounded object-cover"
                    />
                  ) : (
                    <ImageIcon size={18} />
                  )
                )}
                {project.type === 'animation' && <VideoIcon size={18} />}
                {project.type === 'audio' && <MusicIcon size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {project.name}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{project.date}</div>
                  {project.category && (
                    <div className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {project.category}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )) : (
            <div className="text-center text-muted-foreground py-4">
              <div className="text-sm">No recent projects</div>
              <div className="text-xs">Generate some images to get started</div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <button className="flex items-center justify-center w-full p-2 bg-primary hover:bg-primary/90 rounded-md text-sm text-primary-foreground">
          <PlusCircleIcon size={16} className="mr-1.5" />
          New Project
        </button>
      </div>
    </div>
  );
}