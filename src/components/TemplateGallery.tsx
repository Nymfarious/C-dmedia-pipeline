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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // Load built-in templates
        const templateIds = ['business_card_v1', 'planner_weekly_v1', 'tarot_major_v1'];
        const loadedTemplates: TemplateCard[] = [];

        for (const id of templateIds) {
          try {
            const response = await fetch(`/templates/${id}.json`);
            if (response.ok) {
              const spec: TemplateSpec = await response.json();
              
              // Process inputs to create template card
              const requiredInputs: string[] = [];
              const optionalInputs: string[] = [];
              
              Object.entries(spec.inputs).forEach(([key, input]) => {
                if (input.required) {
                  requiredInputs.push(key);
                } else {
                  optionalInputs.push(key);
                }
              });

              loadedTemplates.push({
                id,
                name: spec.name,
                description: spec.description || 'No description available',
                category: spec.category || 'general',
                thumbnail: undefined,
                spec,
                requiredInputs,
                optionalInputs,
              });
            }
          } catch (error) {
            console.warn(`Failed to load template ${id}:`, error);
            setError(`Failed to load template ${id}`);
          }
        }

        setTemplates(loadedTemplates);
        setFilteredTemplates(loadedTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setError('Failed to load templates');
      } finally {
        setIsLoading(false);
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        
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