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
  // Slower transition: 2.5s for a more pronounced ferry effect
  useEffect(() => {
    if (ferryState === 'departing-to-editor') {
      const timer = setTimeout(() => {
        completeFerry();
        navigate('/workspace');
      }, 2500);
      return () => clearTimeout(timer);
    }
    
    if (ferryState === 'departing-to-canvas') {
      const timer = setTimeout(() => {
        completeFerry();
        navigate('/');
      }, 2500);
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
        'fixed top-[14px] left-[245px] z-[200] flex items-center justify-center gap-2',
        'h-11 px-4 rounded-xl',
        'bg-gradient-to-r from-slate-700/80 to-slate-800/80',
        'border border-slate-500/40',
        'text-slate-200 transition-all duration-300',
        'hover:from-slate-600/80 hover:to-slate-700/80',
        'hover:border-slate-400/60 hover:text-slate-100',
        'hover:shadow-lg hover:shadow-slate-500/20',
        'disabled:pointer-events-none disabled:opacity-70',
        getAnimationClass()
      )}
      aria-label={isOnCanvas ? 'Open CORE Editor' : 'Return to Canvas'}
      title={isOnCanvas ? 'Open CORE Timeline Editor' : 'Return to Main Canvas'}
    >
      <FilePen className="h-5 w-5" />
      <span className="text-sm font-medium">
        {isOnCanvas ? 'Timeline' : 'Canvas'}
      </span>
      
      {/* Enhanced motion trail during animation */}
      {isAnimating && (
        <>
          <div 
            className="absolute inset-0 rounded-xl bg-slate-400/20 blur-lg -z-10"
            style={{ 
              transform: 'scaleX(2.5)',
              opacity: 0.6 
            }}
          />
          <div 
            className="absolute inset-0 rounded-xl bg-slate-500/10 blur-xl -z-20"
            style={{ 
              transform: 'scaleX(3)',
              opacity: 0.4 
            }}
          />
        </>
      )}
    </button>
  );
}
