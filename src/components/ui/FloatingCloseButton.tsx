import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingCloseButtonProps {
  onClose: () => void;
  className?: string;
}

export function FloatingCloseButton({ onClose, className = "" }: FloatingCloseButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 ${className}`}
      onClick={onClose}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}