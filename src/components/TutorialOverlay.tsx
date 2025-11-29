import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Wand2, Layers, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector to highlight
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Media Pipeline! 🎨',
    description: 'Create amazing AI-powered images and videos. This quick tour will show you the basics.',
    icon: <Sparkles className="h-6 w-6 text-primary" />,
  },
  {
    id: 'create-canvas',
    title: 'Create Your Canvas',
    description: 'Click "Generate with AI" to create images from text, or "Import File" to upload existing media.',
    icon: <Wand2 className="h-6 w-6 text-blue-500" />,
    highlight: '[data-create-canvas]',
  },
  {
    id: 'timeline',
    title: 'Timeline Mode',
    description: 'Switch to Timeline Mode to arrange clips on Visual, Audio, and FX tracks. Perfect for creating sequences!',
    icon: <Layers className="h-6 w-6 text-purple-500" />,
    highlight: '[data-timeline-mode]',
  },
  {
    id: 'playback',
    title: 'Preview Your Work',
    description: 'Press Space to play/pause. Use the transport controls to navigate through your timeline.',
    icon: <Play className="h-6 w-6 text-green-500" />,
  },
  {
    id: 'help',
    title: 'You\'re All Set!',
    description: 'Check the Quick Start Guide for more tips. Click the wrench icon (🔧) for developer tools and logs.',
    icon: <HelpCircle className="h-6 w-6 text-amber-500" />,
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tutorial Sprite Character */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/4 -translate-y-1/2 pointer-events-none">
        <div className="relative animate-bounce">
          {/* Sprite body */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
              {step.icon}
            </div>
          </div>
          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping animation-delay-200" />
          <div className="absolute top-1/2 -right-4 w-2 h-2 bg-pink-400 rounded-full animate-ping animation-delay-100" />
        </div>
      </div>

      {/* Tutorial Card */}
      <Card className={cn(
        "relative w-full max-w-md mx-4 mt-20 transition-all duration-150",
        isAnimating && "opacity-50 scale-95"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {tutorialSteps.length}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-lg mt-2">{step.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{step.description}</p>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : index < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(isFirstStep && "invisible")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? (
                  <>
                    Get Started
                    <Sparkles className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tutorial trigger button
export function TutorialTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Quick Tour</span>
    </Button>
  );
}
