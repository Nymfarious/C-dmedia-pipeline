import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, X } from 'lucide-react';
import useAppStore from '@/store/appStore';

interface QuickCanvasDeleteProps {
  canvasId: string;
  canvasName: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'outline' | 'destructive';
  showLabel?: boolean;
  className?: string;
}

export const QuickCanvasDelete: React.FC<QuickCanvasDeleteProps> = ({
  canvasId,
  canvasName,
  size = 'sm',
  variant = 'ghost',
  showLabel = false,
  className = ''
}) => {
  const { deleteCanvas } = useAppStore();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Delete</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{canvasName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteCanvas(canvasId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Canvas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface CanvasCloseButtonProps {
  canvasId: string;
  canvasName: string;
  className?: string;
}

export const CanvasCloseButton: React.FC<CanvasCloseButtonProps> = ({
  canvasId,
  canvasName,
  className = ''
}) => {
  const { deleteCanvas, setActiveCanvas } = useAppStore();

  const handleClose = () => {
    setActiveCanvas(null);
    deleteCanvas(canvasId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close and Delete Canvas</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close and delete "{canvasName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Close & Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};