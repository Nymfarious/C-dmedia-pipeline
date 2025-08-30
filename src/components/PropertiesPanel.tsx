import React, { useState } from 'react';
import {
  SlidersIcon,
  PaintbrushIcon,
  LayersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  Wand2,
  RefreshCwIcon,
  ZapIcon,
  MoveIcon,
  CheckIcon,
  Star,
  StarOff,
} from 'lucide-react';
import useAppStore from '@/store/appStore';
import { toast } from 'sonner';

interface PropertiesPanelProps {
  activeTab: string;
}

export function PropertiesPanel({ activeTab }: PropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    dimensions: true,
    brush: false,
    blending: false,
    adjustments: true,
    aiEnhancement: true,
    aiGeneration: true,
    styleTransfer: false,
  });
  const [styleStrength, setStyleStrength] = useState(75);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generatingStyle, setGeneratingStyle] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerationType, setAiGenerationType] = useState('Create New');
  const [isGenerating, setIsGenerating] = useState(false);

  // Store hooks
  const { generateDirectly, createCanvas, setActiveCanvas, getActiveCanvasWithAsset, enqueueStep, runStep } = useAppStore();

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const renderSectionHeader = (title: string, section: string, icon: React.ReactNode = null) => (
    <div
      className="flex items-center justify-between cursor-pointer py-1"
      onClick={() => toggleSection(section)}
    >
      <h3 className="text-sm font-medium flex items-center">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h3>
      {expandedSections[section] ? (
        <ChevronUpIcon size={16} />
      ) : (
        <ChevronDownIcon size={16} />
      )}
    </div>
  );

  const handleStyleClick = (style: string) => {
    setSelectedStyle(style === selectedStyle ? null : style);
  };

  const handleApplyStyle = async () => {
    if (!selectedStyle) return;
    
    const activeCanvasWithAsset = getActiveCanvasWithAsset();
    if (!activeCanvasWithAsset?.asset) {
      toast.error("No image on canvas to apply style to");
      return;
    }

    setGeneratingStyle(true);
    try {
      const stepId = enqueueStep("EDIT", [activeCanvasWithAsset.asset.id], {
        instruction: `Apply ${selectedStyle} style to this image`,
        stylePreset: selectedStyle,
        strength: styleStrength / 100
      }, "replicate.nano-banana");
      
      await runStep(stepId);
      toast.success("Style applied successfully!");
    } catch (error) {
      console.error('Style transfer failed:', error);
      toast.error("Failed to apply style");
    } finally {
      setGeneratingStyle(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      if (aiGenerationType === 'Create New') {
        // Generate new image and create canvas
        const asset = await generateDirectly({ prompt: aiPrompt }, "replicate.flux");
        const canvasId = createCanvas('image', asset);
        setActiveCanvas(canvasId);
        toast.success("Image generated successfully!");
      } else {
        // Modify existing canvas
        const activeCanvasWithAsset = getActiveCanvasWithAsset();
        if (!activeCanvasWithAsset?.asset) {
          toast.error("No image on canvas to modify");
          return;
        }

        const stepId = enqueueStep("EDIT", [activeCanvasWithAsset.asset.id], {
          instruction: aiPrompt
        }, "replicate.nano-banana");
        
        await runStep(stepId);
        toast.success("Image modified successfully!");
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIEnhancement = async (action: string) => {
    const activeCanvasWithAsset = getActiveCanvasWithAsset();
    if (!activeCanvasWithAsset?.asset) {
      toast.error("No image on canvas to enhance");
      return;
    }

    try {
      let stepKind: any;
      let instruction = '';
      
      switch (action) {
        case 'enhance':
          stepKind = "UPSCALE";
          instruction = "enhance and upscale this image";
          break;
        case 'remove-bg':
          stepKind = "REMOVE_BG";
          instruction = "remove the background from this image";
          break;
        case 'upscale':
          stepKind = "UPSCALE";
          instruction = "upscale this image to higher resolution";
          break;
      }

      const stepId = enqueueStep(stepKind, [activeCanvasWithAsset.asset.id], {
        instruction
      }, stepKind === "REMOVE_BG" ? "replicate.rembg" : "replicate.nano-banana");
      
      await runStep(stepId);
      toast.success(`${action} completed successfully!`);
    } catch (error) {
      console.error(`${action} failed:`, error);
      toast.error(`Failed to ${action}`);
    }
  };

  const stylePresets = [
    {
      id: 'photorealistic',
      name: 'Photorealistic',
    },
    {
      id: 'cinematic',
      name: 'Cinematic',
    },
    {
      id: 'anime',
      name: 'Anime',
    },
    {
      id: 'digital-art',
      name: 'Digital Art',
    },
    {
      id: 'abstract',
      name: 'Abstract',
    },
    {
      id: 'oil-painting',
      name: 'Oil Painting',
    },
  ];

  return (
    <div className="p-2">
      <div className="mb-4">
        {renderSectionHeader(
          'Dimensions',
          'dimensions',
          <MoveIcon size={14} />,
        )}
        {expandedSections.dimensions && (
          <div className="bg-muted rounded-md p-3 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Width</span>
              <div className="flex items-center bg-background rounded">
                <input
                  type="number"
                  className="w-16 bg-transparent px-2 py-1 text-right text-sm"
                  value="1200"
                  readOnly
                />
                <span className="pr-2 text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Height</span>
              <div className="flex items-center bg-background rounded">
                <input
                  type="number"
                  className="w-16 bg-transparent px-2 py-1 text-right text-sm"
                  value="800"
                  readOnly
                />
                <span className="pr-2 text-xs text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        {renderSectionHeader(
          'Adjustments',
          'adjustments',
          <SlidersIcon size={14} />,
        )}
        {expandedSections.adjustments && (
          <div className="space-y-3 bg-muted rounded-md p-3 mt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Brightness</span>
                <span className="text-xs text-muted-foreground">0</span>
              </div>
              <input
                type="range"
                className="w-full accent-primary"
                min="-100"
                max="100"
                defaultValue="0"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Contrast</span>
                <span className="text-xs text-muted-foreground">0</span>
              </div>
              <input
                type="range"
                className="w-full accent-primary"
                min="-100"
                max="100"
                defaultValue="0"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Saturation</span>
                <span className="text-xs text-muted-foreground">0</span>
              </div>
              <input
                type="range"
                className="w-full accent-primary"
                min="-100"
                max="100"
                defaultValue="0"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button className="flex items-center px-2 py-1 bg-primary rounded-md hover:bg-primary/90 text-xs text-primary-foreground">
                <CheckIcon size={12} className="mr-1" />
                Apply Adjustments
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        {renderSectionHeader(
          'Style Transfer',
          'styleTransfer',
          <Wand2 size={14} />,
        )}
        {expandedSections.styleTransfer && (
          <div className="bg-muted rounded-md p-3 mt-1">
            <div className="mb-3">
              <span className="text-sm block mb-2">Style Presets</span>
              <div className="grid grid-cols-3 gap-2">
                {stylePresets.map((style) => (
                  <div key={style.id} className="flex flex-col items-center">
                    <div
                      className={`w-full aspect-square rounded-md bg-background flex items-center justify-center mb-1 cursor-pointer relative border transition-colors ${
                        selectedStyle === style.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleStyleClick(style.id)}
                    >
                      <span className="text-xs text-center">{style.name.slice(0, 3)}</span>
                      {selectedStyle === style.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md">
                          <CheckIcon size={16} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{style.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Style Strength</span>
                <span className="text-xs text-muted-foreground">{styleStrength}%</span>
              </div>
              <input
                type="range"
                className="w-full accent-primary"
                min="1"
                max="100"
                value={styleStrength}
                onChange={(e) => setStyleStrength(parseInt(e.target.value))}
              />
            </div>
            <button
              className={`w-full mt-3 flex items-center justify-center px-3 py-2 rounded-md text-sm transition-colors ${
                selectedStyle 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                  : 'bg-primary/50 cursor-not-allowed text-primary-foreground/50'
              }`}
              disabled={!selectedStyle || generatingStyle}
              onClick={handleApplyStyle}
            >
              {generatingStyle ? (
                <>
                  <RefreshCwIcon size={14} className="mr-2 animate-spin" />
                  Applying Style...
                </>
              ) : (
                <>
                  <Wand2 size={14} className="mr-2" />
                  Apply Style Transfer
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        {renderSectionHeader(
          'AI Generation',
          'aiGeneration',
          <SparklesIcon size={14} />,
        )}
        {expandedSections.aiGeneration && (
          <div className="bg-muted rounded-md p-3 mt-1">
            <div className="mb-3">
              <label className="block text-sm mb-1.5">
                Generate From Prompt
              </label>
              <textarea
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe what you want to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm">Generation Type</span>
                <select 
                  className="bg-background border border-border rounded px-2 py-1 text-xs"
                  value={aiGenerationType}
                  onChange={(e) => setAiGenerationType(e.target.value)}
                >
                  <option>Create New</option>
                  <option>Modify Selection</option>
                  <option>Inpainting</option>
                  <option>Outpainting</option>
                </select>
              </div>
            </div>
            <button 
              className="w-full flex items-center justify-center px-3 py-2 bg-primary rounded-md hover:bg-primary/90 text-sm text-primary-foreground disabled:opacity-50"
              onClick={handleGenerateImage}
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon size={14} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon size={14} className="mr-2" />
                  Generate Image
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div>
        {renderSectionHeader(
          'AI Enhancement',
          'aiEnhancement',
          <ZapIcon size={14} />,
        )}
        {expandedSections.aiEnhancement && (
          <div className="bg-muted rounded-md p-3 mt-1">
            <div className="space-y-2">
              <button 
                className="w-full flex items-center justify-center px-3 py-2 bg-primary rounded-md hover:bg-primary/90 text-sm text-primary-foreground"
                onClick={() => handleAIEnhancement('enhance')}
              >
                <ZapIcon size={14} className="mr-2" />
                Auto Enhance
              </button>
              <button 
                className="w-full flex items-center justify-center px-3 py-2 bg-secondary rounded-md hover:bg-secondary/90 text-sm"
                onClick={() => handleAIEnhancement('remove-bg')}
              >
                Remove Background
              </button>
              <button 
                className="w-full flex items-center justify-center px-3 py-2 bg-secondary rounded-md hover:bg-secondary/90 text-sm"
                onClick={() => handleAIEnhancement('upscale')}
              >
                Upscale Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}