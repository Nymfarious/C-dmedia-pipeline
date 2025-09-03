import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TemplateSpec } from '@/compositor/TemplateSpec';
import { Search, FileImage, Palette, Users, Calendar, CreditCard } from 'lucide-react';

interface TemplateGalleryProps {
  onSelectTemplate?: (template: TemplateSpec) => void;
  className?: string;
}

interface TemplateCard {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  spec: TemplateSpec;
  requiredInputs: string[];
  optionalInputs: string[];
}

export function TemplateGallery({ onSelectTemplate, className }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCard | null>(null);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Load built-in templates
        const businessCardResponse = await fetch('/templates/business_card_v1.json');
        const businessCardSpec = await businessCardResponse.json();
        
        const plannerResponse = await fetch('/templates/planner_weekly_v1.json');
        const plannerSpec = await plannerResponse.json();
        
        const tarotResponse = await fetch('/templates/tarot_major_v1.json');
        const tarotSpec = await tarotResponse.json();

        const templateCards: TemplateCard[] = [
          {
            id: 'business_card_v1',
            name: businessCardSpec.name,
            description: businessCardSpec.description,
            category: businessCardSpec.category,
            spec: businessCardSpec,
            requiredInputs: Object.keys(businessCardSpec.inputs).filter(key => businessCardSpec.inputs[key].required),
            optionalInputs: Object.keys(businessCardSpec.inputs).filter(key => !businessCardSpec.inputs[key].required)
          },
          {
            id: 'planner_weekly_v1', 
            name: plannerSpec.name,
            description: plannerSpec.description,
            category: plannerSpec.category,
            spec: plannerSpec,
            requiredInputs: Object.keys(plannerSpec.inputs).filter(key => plannerSpec.inputs[key].required),
            optionalInputs: Object.keys(plannerSpec.inputs).filter(key => !plannerSpec.inputs[key].required)
          },
          {
            id: 'tarot_major_v1',
            name: tarotSpec.name, 
            description: tarotSpec.description,
            category: tarotSpec.category,
            spec: tarotSpec,
            requiredInputs: Object.keys(tarotSpec.inputs).filter(key => tarotSpec.inputs[key].required),
            optionalInputs: Object.keys(tarotSpec.inputs).filter(key => !tarotSpec.inputs[key].required)
          }
        ];

        setTemplates(templateCards);
        setFilteredTemplates(templateCards);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;
    
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return <CreditCard className="h-4 w-4" />;
      case 'personal': return <Users className="h-4 w-4" />;
      case 'creative': return <Palette className="h-4 w-4" />;
      case 'planning': return <Calendar className="h-4 w-4" />;
      default: return <FileImage className="h-4 w-4" />;
    }
  };

  const handleTemplateSelect = (template: TemplateCard) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.spec);
    }
    setSelectedTemplate(null);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold mb-4">Template Gallery</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category !== 'all' && getCategoryIcon(category)}
              {category}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {getCategoryIcon(template.category)}
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-muted-foreground">
                    Required: {template.requiredInputs.length} • Optional: {template.optionalInputs.length}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {template.requiredInputs.slice(0, 3).map(input => (
                      <Badge key={input} variant="outline" className="text-xs px-1 py-0">
                        {input.replace('_', ' ')}
                      </Badge>
                    ))}
                    {template.requiredInputs.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        +{template.requiredInputs.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{template.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Required Inputs</h4>
                            <div className="space-y-1">
                              {template.requiredInputs.map(input => (
                                <div key={input} className="text-xs p-2 bg-muted rounded">
                                  {input.replace('_', ' ')}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2">Optional Inputs</h4>
                            <div className="space-y-1">
                              {template.optionalInputs.map(input => (
                                <div key={input} className="text-xs p-2 bg-muted/50 rounded">
                                  {input.replace('_', ' ')}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={() => handleTemplateSelect(template)} className="flex-1">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No templates found matching your criteria</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}