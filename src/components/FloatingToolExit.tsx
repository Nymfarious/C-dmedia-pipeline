import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
export function FloatingToolExit() {
  const {
    activeTool,
    exitActiveTool
  } = useAppStore();
  if (activeTool === 'select') {
    return null;
  }
  return <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-right-2 duration-300">
      
    </div>;
}