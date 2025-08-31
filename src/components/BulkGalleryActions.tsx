import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Download, CheckSquare, Square } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { toast } from 'sonner';

interface BulkGalleryActionsProps {
  selectedImageIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalImages: number;
}

export function BulkGalleryActions({ 
  selectedImageIds, 
  onClearSelection, 
  onSelectAll, 
  totalImages 
}: BulkGalleryActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { removeFromGallery, galleryImages } = useAppStore();

  const handleBulkDelete = () => {
    try {
      selectedImageIds.forEach(id => removeFromGallery(id));
      onClearSelection();
      toast.success(`Deleted ${selectedImageIds.length} image${selectedImageIds.length > 1 ? 's' : ''} from gallery`);
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete images');
      console.error('Bulk delete error:', error);
    }
  };

  const handleBulkDownload = async () => {
    try {
      const selectedImages = galleryImages.filter(img => selectedImageIds.includes(img.id));
      
      for (const image of selectedImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${image.prompt.slice(0, 30)}_${image.id}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Downloaded ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to download images');
      console.error('Bulk download error:', error);
    }
  };

  if (selectedImageIds.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          <CheckSquare className="h-4 w-4 mr-1" />
          Select All ({totalImages})
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
        <span className="text-sm font-medium text-primary">
          {selectedImageIds.length} image{selectedImageIds.length > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            <Square className="h-4 w-4 mr-1" />
            Clear
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleBulkDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Images</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedImageIds.length} image{selectedImageIds.length > 1 ? 's' : ''} from your gallery? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedImageIds.length} Image{selectedImageIds.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}