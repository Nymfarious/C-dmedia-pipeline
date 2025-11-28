import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FilePen } from 'lucide-react';
import { useModeFerry } from './ModeFerryContext';
import { cn } from '@/lib/utils';

/**
 * ModeFerry - Animated navigation button that "ferries" between Canvas and Editor modes
 * 
 * Animation flow:
 * 1. Canvas → Editor: Icon slides from left to right (~1.5s), then navigates
 * 2. Editor load: Icon slides from right to left into final position (~0.5s)
 * 3. Editor → Canvas: Same animation in reverse
 */
export function ModeFerry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ferryState, startFerry, completeFerry, isAnimating } = useModeFerry();
  const ferryRef = useRef<HTMLButtonElement>(null);
  const [justArrived, setJustArrived] = useState(false);

  const isOnWorkspace = location.pathname === '/workspace';
  const isOnCanvas = location.pathname === '/';

  // Handle navigation after departure animation completes
  useEffect(() => {
    if (ferryState === 'departing-to-editor') {
      const timer = setTimeout(() => {
        completeFerry();
        navigate('/workspace');
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (ferryState === 'departing-to-canvas') {
      const timer = setTimeout(() => {
        completeFerry();
        navigate('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [ferryState, navigate, completeFerry]);

  // Handle arrival animation
  useEffect(() => {
    if (ferryState === 'arriving-at-editor' || ferryState === 'arriving-at-canvas') {
      setJustArrived(true);
      const timer = setTimeout(() => setJustArrived(false), 500);
      return () => clearTimeout(timer);
    }
  }, [ferryState]);

  const handleClick = () => {
    if (isAnimating) return;
    
    if (isOnCanvas) {
      startFerry('editor');
    } else if (isOnWorkspace) {
      startFerry('canvas');
    }
  };

  // Don't render on routes other than / or /workspace
  if (!isOnCanvas && !isOnWorkspace && ferryState === 'idle') {
    return null;
  }

  // Determine animation class based on state
  const getAnimationClass = () => {
    if (ferryState === 'departing-to-editor') {
      return 'animate-ferry-to-right';
    }
    if (ferryState === 'departing-to-canvas') {
      return 'animate-ferry-to-left';
    }
    if (justArrived) {
      return 'animate-ferry-arrive';
    }
    return '';
  };

  return (
    <button
      ref={ferryRef}
      onClick={handleClick}
      disabled={isAnimating}
      className={cn(
        'fixed top-[17px] left-[245px] z-[200] flex items-center justify-center',
        'w-9 h-9 rounded-lg',
        'bg-purple-600/30 border border-purple-400/60',
        'text-purple-300 transition-colors duration-200',
        'hover:bg-purple-500/40 hover:border-purple-400/80',
        'hover:text-purple-200',
        'hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]',
        'disabled:pointer-events-none disabled:opacity-70',
        getAnimationClass()
      )}
      aria-label={isOnCanvas ? 'Open CORE Editor' : 'Return to Canvas'}
      title={isOnCanvas ? 'Open CORE Timeline Editor' : 'Return to Main Canvas'}
    >
      <FilePen className="h-4 w-4" />
      
      {/* Subtle motion trail during animation */}
      {isAnimating && (
        <div 
          className="absolute inset-0 rounded-lg bg-purple-500/30 blur-md -z-10"
          style={{ 
            transform: 'scaleX(2)',
            opacity: 0.5 
          }}
        />
      )}
    </button>
  );
}
