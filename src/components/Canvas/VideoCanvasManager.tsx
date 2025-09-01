import React from 'react';
import { VideoGenerationTool } from './VideoGenerationTool';
import useAppStore from '@/store/appStore';

export function VideoCanvasManager() {
  const { activeTool, setActiveTool } = useAppStore();

  const handleClose = () => {
    setActiveTool(null);
  };

  return (
    <VideoGenerationTool
      isActive={activeTool === 'video'}
      onClose={handleClose}
    />
  );
}