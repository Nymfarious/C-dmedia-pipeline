import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, Shuffle } from 'lucide-react';
import { Asset } from '@/types/media';

interface FaceSwapToolProps {
  sourceAsset?: Asset;
  onFaceSwap: (targetImageUrl: string, swapType: 'single' | 'multiple') => void;
  onIdentityPreserve: (referenceImageUrl: string) => void;
  className?: string;
}

export const FaceSwapTool: React.FC<FaceSwapToolProps> = ({ 
  sourceAsset,
  onFaceSwap, 
  onIdentityPreserve,
  className 
}) => {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState<'single' | 'multiple'>('single');

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaceSwap = () => {
    if (targetImage) {
      onFaceSwap(targetImage, swapMode);
    }
  };

  const handleIdentityPreserve = () => {
    if (referenceImage) {
      onIdentityPreserve(referenceImage);
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Face & Identity Tools</h3>
        <Badge variant="secondary">IP-Adapter FaceID</Badge>
      </div>
      
      <div className="space-y-6">
        {/* Face Swap Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            <h4 className="font-medium">Face Swap</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Source (Current Image)</p>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                {sourceAsset?.src ? (
                  <img 
                    src={sourceAsset.src} 
                    alt="Source" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No source image</p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Target Face</p>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative">
                {targetImage ? (
                  <img 
                    src={targetImage} 
                    alt="Target" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setTargetImage)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={swapMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSwapMode('single')}
            >
              Single Face
            </Button>
            <Button
              variant={swapMode === 'multiple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSwapMode('multiple')}
            >
              All Faces
            </Button>
          </div>
          
          <Button 
            onClick={handleFaceSwap} 
            disabled={!targetImage || !sourceAsset}
            className="w-full"
            size="sm"
          >
            Perform Face Swap
          </Button>
        </div>
        
        <div className="border-t pt-4">
          {/* Identity Preservation Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h4 className="font-medium">Identity Preservation</h4>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Upload a reference image to maintain character consistency across multiple edits
            </p>
            
            <div className="text-center">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative max-w-48 mx-auto">
                {referenceImage ? (
                  <img 
                    src={referenceImage} 
                    alt="Reference" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Upload Reference</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setReferenceImage)}
                    />
                  </label>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleIdentityPreserve} 
              disabled={!referenceImage}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Set Identity Reference
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>• Face swap preserves facial features while maintaining pose and expression</p>
          <p>• Identity preservation helps maintain character consistency across edits</p>
          <p>• Works best with clear, front-facing portraits</p>
        </div>
      </div>
    </Card>
  );
};