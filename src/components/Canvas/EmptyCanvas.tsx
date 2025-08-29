import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, FileImage } from 'lucide-react';

interface EmptyCanvasProps {
  onGenerate: (prompt: string, provider: string) => Promise<void>;
  onImport: () => void;
  isGenerating?: boolean;
}

export function EmptyCanvas({ onGenerate, onImport, isGenerating }: EmptyCanvasProps) {
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('replicate.flux');

  const handleGenerate = () => {
    if (generatePrompt.trim()) {
      onGenerate(generatePrompt, selectedProvider);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-primary rounded-lg border border-primary/20">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-card">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Create Your Canvas</h2>
          <p className="text-muted-foreground">
            Start by generating an image with AI or import an existing asset
          </p>
        </div>

        <Card className="bg-card/80 backdrop-blur">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replicate.flux">Flux</SelectItem>
                    <SelectItem value="replicate.sd">Stable Diffusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isGenerating}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!generatePrompt.trim() || isGenerating}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
                <Button variant="outline" onClick={onImport} disabled={isGenerating}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}