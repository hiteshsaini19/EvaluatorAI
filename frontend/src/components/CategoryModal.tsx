'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
  description?: string;
  parent_category?: string | null;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categories: Category[];
  editData?: {
    id: number;
    name: string;
    description?: string;
    parent_category?: string | null;
  } | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editData
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description || '');
      // Set parent category by finding the matching category name
      setParentCategory(editData.parent_category || '');
    } else {
      setName('');
      setDescription('');
      setParentCategory('');
    }
    setError('');
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data: any = {
        name: name.trim(),
        description: description.trim() || null,
      };

      if (parentCategory && parentCategory !== 'none') {
        // Set parent_category as the category name (string)
        data.parent_category = parentCategory;
      } else {
        // Main category - parent_category is null
        data.parent_category = null;
      }

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const isSubcategory = parentCategory && parentCategory !== 'none';

  const derivedParents = Array.from(new Set([
    ...categories.filter(c => !c.parent_category || c.parent_category === 'Main Category').map(c => c.name),
    ...categories.map(c => c.parent_category).filter((p): p is string => !!p && p !== 'Main Category')
  ])).sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {editData
              ? 'Update the category details below'
              : 'Fill in the details to create a new category or subcategory'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Parent Category Selector */}
          <div>
            <Label htmlFor="parent" className="text-sm font-medium">
              Parent Category <span className="text-gray-500">(Optional)</span>
            </Label>
            <Select
              value={parentCategory}
              onValueChange={setParentCategory}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="None (Main Category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Main Category)</SelectItem>
                {derivedParents.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {isSubcategory
                ? 'This will be created as a subcategory under the selected parent'
                : 'Leave empty to create a main category'}
            </p>
          </div>

          {/* Category/Subcategory Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              {isSubcategory ? 'Subcategory Name' : 'Category Name'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., JavaScript, React, Node.js"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required. Choose a clear, descriptive name for this {isSubcategory ? 'subcategory' : 'category'}
            </p>
          </div>

          {/* Description - Available for both Main Categories and Subcategories */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Help others understand what types of questions belong in this category
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : editData ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}