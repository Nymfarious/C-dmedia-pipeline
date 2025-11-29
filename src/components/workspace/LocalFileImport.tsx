import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';

interface LocalFileImportProps {
  onImport?: (assets: Asset[]) => void;
  maxFiles?: number;
  acceptTypes?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

const MAX_FILES = 7;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/webm,video/quicktime';
const ACCEPTED_AUDIO_TYPES = 'audio/mpeg,audio/wav,audio/ogg,audio/aac';
const ALL_ACCEPTED = `${ACCEPTED_IMAGE_TYPES},${ACCEPTED_VIDEO_TYPES},${ACCEPTED_AUDIO_TYPES}`;

export function LocalFileImport({
  onImport,
  maxFiles = MAX_FILES,
  acceptTypes = ALL_ACCEPTED,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: LocalFileImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addAssets, createCanvas, setActiveCanvas } = useAppStore();

  const getMediaType = (file: File): 'image' | 'video' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'image'; // Default fallback
  };

  const processFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    if (files.length > maxFiles) {
      toast.warning(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} will be imported.`);
    }

    const importedAssets: Asset[] = [];

    for (const file of fileArray) {
      try {
        const objectUrl = URL.createObjectURL(file);
        const mediaType = getMediaType(file);
        
        // Get dimensions for images
        let meta: Record<string, any> = {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
        };

        if (mediaType === 'image') {
          const dimensions = await getImageDimensions(objectUrl);
          meta = { ...meta, ...dimensions };
        }

        const asset: Asset = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: mediaType,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          src: objectUrl,
          meta,
          createdAt: Date.now(),
          category: 'uploaded',
          subcategory: 'Local Files',
        };

        importedAssets.push(asset);
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        toast.error(`Failed to import ${file.name}`);
      }
    }

    if (importedAssets.length > 0) {
      // Add to store
      addAssets(importedAssets);
      
      // Callback if provided
      if (onImport) {
        onImport(importedAssets);
      }

      // Open first image in canvas
      if (importedAssets.length === 1 && importedAssets[0].type === 'image') {
        const canvasId = createCanvas('image', importedAssets[0]);
        setActiveCanvas(canvasId);
      }

      toast.success(`Imported ${importedAssets.length} file${importedAssets.length > 1 ? 's' : ''}`);
    }
  }, [maxFiles, addAssets, onImport, createCanvas, setActiveCanvas]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptTypes}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        {children || (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Import File
          </>
        )}
      </Button>
    </>
  );
}

// Helper to get image dimensions
function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Drag and drop zone component
interface DropZoneProps {
  onFilesDropped: (files: FileList) => void;
  children: React.ReactNode;
  className?: string;
}

export function FileDropZone({ onFilesDropped, children, className }: DropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesDropped(files);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={className}
    >
      {children}
    </div>
  );
}
