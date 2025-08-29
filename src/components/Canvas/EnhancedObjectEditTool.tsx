import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eraser, Plus, Loader2, CheckCircle } from 'lucide-react';
import { EnhancedBrushTool } from './EnhancedBrushTool';
import { ImageEditParams } from '@/types/media';
import { toast } from 'sonner';

interface EnhancedObjectEditToolProps {
  onEditComplete: (params: ImageEditParams) => Promise<void>;
  imageUrl: string;
  className?: string;
  onCancel?: () => void;
}

export function EnhancedObjectEditTool({ 
  onEditComplete, 
  imageUrl, 
  className,
  onCancel 
}: EnhancedObjectEditToolProps) {
  const [activeTab, setActiveTab] = useState('remove');
  const [removeInstruction, setRemoveInstruction] = useState('Remove the marked objects cleanly');
  const [addInstruction, setAddInstruction] = useState('Add a small object in the marked area');
  const [mask, setMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrushTool, setShowBrushTool] = useState(true);

  const handleMaskExport = (maskData: { dataUrl: string; blob: Blob }) => {
    setMask(maskData);
    setShowBrushTool(false);
    toast.success('Mask created! Ready to process.');
  };

  const handleRemoveObject = async () => {
    if (!mask) {
      toast.error('Please create a mask first');
      return;
    }

    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'remove-object',
        instruction: removeInstruction,
        removeObjectInstruction: removeInstruction,
        maskPngDataUrl: mask.dataUrl,
        maskBlob: mask.blob
      };
      
      await onEditComplete(params);
      toast.success('Object removed successfully!');
    } catch (error) {
      console.error('Remove object error:', error);
      toast.error('Failed to remove object');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddObject = async () => {
    if (!mask) {
      toast.error('Please create a mask first');
      return;
    }

    setIsProcessing(true);
    try {
      const params: ImageEditParams = {
        operation: 'add-object',
        instruction: addInstruction,
        addObjectInstruction: addInstruction,
        maskPngDataUrl: mask.dataUrl,
        maskBlob: mask.blob
      };
      
      await onEditComplete(params);
      toast.success('Object added successfully!');
    } catch (error) {
      console.error('Add object error:', error);
      toast.error('Failed to add object');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetMask = () => {
    setMask(null);
    setShowBrushTool(true);
  };

  const handleCancel = () => {
    resetMask();
    onCancel?.();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Object Editor</span>
          {mask && <CheckCircle className="h-5 w-5 text-status-done" />}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="remove" disabled={isProcessing}>
              <Eraser className="h-4 w-4 mr-2" />
              Remove Object
            </TabsTrigger>
            <TabsTrigger value="add" disabled={isProcessing}>
              <Plus className="h-4 w-4 mr-2" />
              Add Object
            </TabsTrigger>
          </TabsList>

          <TabsContent value="remove" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remove-instruction">What to remove:</Label>
              <Input
                id="remove-instruction"
                value={removeInstruction}
                onChange={(e) => setRemoveInstruction(e.target.value)}
                placeholder="Describe what to remove..."
                disabled={isProcessing}
              />
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-instruction">What to add:</Label>
              <Input
                id="add-instruction"
                value={addInstruction}
                onChange={(e) => setAddInstruction(e.target.value)}
                placeholder="Describe what to add..."
                disabled={isProcessing}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Brush Tool or Mask Preview */}
        {showBrushTool ? (
          <EnhancedBrushTool 
            imageUrl={imageUrl} 
            onExportMask={handleMaskExport}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mask created successfully</span>
              <Button variant="outline" size="sm" onClick={resetMask} disabled={isProcessing}>
                Edit Mask
              </Button>
            </div>
            
            {/* Process Button */}
            <Button 
              onClick={activeTab === 'remove' ? handleRemoveObject : handleAddObject}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {activeTab === 'remove' ? <Eraser className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {activeTab === 'remove' ? 'Remove Object' : 'Add Object'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}