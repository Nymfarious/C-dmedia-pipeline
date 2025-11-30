import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopoutWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function PopoutWindow({ isOpen, onClose, title, children }: PopoutWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const windowStyle = isMaximized
    ? 'inset-4'
    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] max-w-[1400px]';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Popout Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed ${windowStyle} bg-background border border-border rounded-xl shadow-2xl z-[101] flex flex-col overflow-hidden transition-all duration-200`}
        ref={containerRef}
      >
        {/* Header */}
        <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0 bg-secondary/30">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
