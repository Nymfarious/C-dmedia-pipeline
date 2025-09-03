import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, X, FolderOpen } from 'lucide-react';
import { Asset } from '@/types/media';
import { AssetImportModal } from './AssetImportModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useAppStore from '@/store/appStore';

interface TemplateAssetUploadProps {
  value?: Asset;
  onChange: (asset: Asset | null) => void;
  placeholder?: string;
  accept?: string;
  className?: string;
}

export const TemplateAssetUpload: React.FC<TemplateAssetUploadProps> = ({
  value,
  onChange,
  placeholder = "Upload or select an asset",
  accept = "image/*",
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { addAsset } = useAppStore();

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (accept === "image/*" && !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const asset: Asset = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        name: file.name,
        src: e.target?.result as string,
        createdAt: Date.now(),
        category: 'uploads',
        subcategory: 'template',
        tags: ['upload', 'template'],
        meta: {
          fileSize: file.size,
          fileType: file.type
        }
      };

      // Add to global asset store
      addAsset(asset);
      onChange(asset);
      toast.success(`Uploaded ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleImportAsset = (asset: Asset) => {
    onChange(asset);
    setIsImportOpen(false);
    toast.success(`Selected ${asset.name}`);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value ? (
        <Card className="relative">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                <img
                  src={value.src}
                  alt={value.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{value.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Image className="h-3 w-3 mr-1" />
                    {value.type}
                  </Badge>
                  {value.category && (
                    <Badge variant="outline" className="text-xs">
                      {value.category}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImportOpen(true)}
          className="flex-1"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Select Existing
        </Button>
      </div>

      <AssetImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportAsset}
      />
    </div>
  );
};