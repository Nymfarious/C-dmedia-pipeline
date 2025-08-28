import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import useAppStore from "@/store/appStore";
import { CategoryInfo } from "@/types/media";
import { Plus, Settings, X, Edit } from "lucide-react";
import { toast } from "sonner";

export const CategoryManagement = () => {
  const { customCategories, addCustomCategory, removeCustomCategory, updateCustomCategory } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const categoryExists = customCategories.some(cat => cat.name === newCategory.trim());
    if (categoryExists) {
      toast.error("Category already exists");
      return;
    }

    const category: CategoryInfo = {
      id: newCategory.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.trim(),
      subcategories: newSubcategory.trim() ? [newSubcategory.trim()] : []
    };

    addCustomCategory(category);
    setNewCategory('');
    setNewSubcategory('');
    toast.success("Category created");
  };

  const handleAddSubcategory = (categoryName: string, subcategory: string) => {
    if (!subcategory.trim()) return;
    
    const category = customCategories.find(cat => cat.name === categoryName);
    if (!category) return;

    if (category.subcategories.includes(subcategory.trim())) {
      toast.error("Subcategory already exists");
      return;
    }

    const updatedCategory = {
      ...category,
      subcategories: [...category.subcategories, subcategory.trim()]
    };

    updateCustomCategory(categoryName, updatedCategory);
    toast.success("Subcategory added");
  };

  const handleRemoveSubcategory = (categoryName: string, subcategory: string) => {
    const category = customCategories.find(cat => cat.name === categoryName);
    if (!category) return;

    const updatedCategory = {
      ...category,
      subcategories: category.subcategories.filter(sub => sub !== subcategory)
    };

    updateCustomCategory(categoryName, updatedCategory);
    toast.success("Subcategory removed");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Category Management</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium">Create New Category</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Characters"
                />
              </div>
              <div>
                <Label htmlFor="subcategory-name">Initial Subcategory (optional)</Label>
                <Input
                  id="subcategory-name"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="e.g., Heroes"
                />
              </div>
            </div>
            <Button onClick={handleAddCategory} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>

          {/* Existing Categories */}
          <div className="space-y-4">
            <h3 className="font-medium">Custom Categories</h3>
            {customCategories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No custom categories yet. Create one above!
              </p>
            ) : (
              <div className="space-y-3">
                {customCategories.map((category) => (
                  <CategoryCard
                    key={category.name}
                    category={category}
                    onRemove={() => {
                      removeCustomCategory(category.name);
                      toast.success("Category removed");
                    }}
                    onAddSubcategory={(subcategory) => handleAddSubcategory(category.name, subcategory)}
                    onRemoveSubcategory={(subcategory) => handleRemoveSubcategory(category.name, subcategory)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CategoryCardProps {
  category: CategoryInfo;
  onRemove: () => void;
  onAddSubcategory: (subcategory: string) => void;
  onRemoveSubcategory: (subcategory: string) => void;
}

const CategoryCard = ({ category, onRemove, onAddSubcategory, onRemoveSubcategory }: CategoryCardProps) => {
  const [newSub, setNewSub] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);

  const handleAddSub = () => {
    if (newSub.trim()) {
      onAddSubcategory(newSub.trim());
      setNewSub('');
      setShowAddSub(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{category.name}</h4>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {category.subcategories.map((sub) => (
            <Badge key={sub} variant="secondary" className="group gap-1">
              {sub}
              <button
                onClick={() => onRemoveSubcategory(sub)}
                className="hover:text-destructive ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        {showAddSub ? (
          <div className="flex gap-2">
                <Input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  placeholder="Subcategory name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
                />
            <Button size="sm" onClick={handleAddSub}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddSub(false)}>Cancel</Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddSub(true)}
            className="text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Subcategory
          </Button>
        )}
      </div>
    </div>
  );
};
