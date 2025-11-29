import { useEffect } from 'react';
import { triggerHaptic } from '@/lib/haptics';
import { logMendComplete } from '@/lib/timelineLogger';

interface MendingOverlayProps {
  position: number;
  onComplete: () => void;
}

export function MendingOverlay({ position, onComplete }: MendingOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerHaptic('success');
      logMendComplete(position);
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete, position]);

  return (
    <div 
      className="absolute top-0 bottom-0 w-8 pointer-events-none z-50"
      style={{ left: position - 16 }}
    >
      {/* Glowing stitch line */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gradient-to-b from-purple-400 via-yellow-300 to-purple-400 animate-pulse" />
      
      {/* Sparkle particles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-100" />
      <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full animate-ping animation-delay-200" />
      
      {/* Flash effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
    </div>
  );
}
