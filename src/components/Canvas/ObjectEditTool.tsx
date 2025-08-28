import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eraser, Plus } from 'lucide-react';
import { BrushTool } from './BrushTool';
import { ImageEditParams } from '@/types/media';

interface ObjectEditToolProps {
  onEditComplete: (params: ImageEditParams) => void;
  imageUrl: string;
  className?: string;
}

export function ObjectEditTool({ onEditComplete, imageUrl, className }: ObjectEditToolProps) {
  const [activeTab, setActiveTab] = useState('remove');
  const [removeInstruction, setRemoveInstruction] = useState('Remove the marked objects cleanly');
  const [addInstruction, setAddInstruction] = useState('Add a small object in the marked area');
  const [mask, setMask] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMaskExport = (maskData: { dataUrl: string; blob: Blob }) => {
    setMask(maskData);
  };

  const handleRemoveObject = async () => {
    if (!mask) {
      alert('Please paint a mask first');
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddObject = async () => {
    if (!mask) {
      alert('Please paint a mask where to add the object');
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="remove">
            <Eraser className="h-4 w-4 mr-2" />
            Remove Object
          </TabsTrigger>
          <TabsTrigger value="add">
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
            />
          </div>
          
          <BrushTool imageUrl={imageUrl} onExportMask={handleMaskExport} />
          
          <Button 
            onClick={handleRemoveObject} 
            disabled={!mask || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Removing...' : 'Remove Object'}
          </Button>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-instruction">What to add:</Label>
            <Input
              id="add-instruction"
              value={addInstruction}
              onChange={(e) => setAddInstruction(e.target.value)}
              placeholder="Describe what to add..."
            />
          </div>
          
          <BrushTool imageUrl={imageUrl} onExportMask={handleMaskExport} />
          
          <Button 
            onClick={handleAddObject} 
            disabled={!mask || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Adding...' : 'Add Object'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}