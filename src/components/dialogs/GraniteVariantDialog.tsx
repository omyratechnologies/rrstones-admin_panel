import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { graniteApi } from '@/services/graniteApi';
import type { GraniteVariant } from '@/types';

interface GraniteVariantDialogProps {
  variant?: GraniteVariant;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function GraniteVariantDialog({ variant, onSuccess, onClose }: GraniteVariantDialogProps) {
  const [formData, setFormData] = useState({
    name: variant?.name || '',
    description: variant?.description || '',
    image: variant?.image || '',
  });

  const queryClient = useQueryClient();
  const isEditing = !!variant;

  const createMutation = useMutation({
    mutationFn: graniteApi.createVariant,
    onSuccess: () => {
      alert('Granite variant created successfully');
      queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
      setFormData({ name: '', description: '', image: '' });
      onSuccess?.();
      onClose?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to create granite variant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<GraniteVariant>) => graniteApi.updateVariant(variant!._id, data),
    onSuccess: () => {
      alert('Granite variant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
      onSuccess?.();
      onClose?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update granite variant');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a variant name');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: formData.image.trim() || 'https://example.com/images/granite-placeholder.jpg',
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              {isEditing ? 'Edit Granite Variant' : 'Add New Granite Variant'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update the base granite variant details.' 
                : 'Create a new base granite variant.'
              }
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Variant Name *</label>
            <Input
              placeholder="e.g., Black Galaxy, Blue Granite"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              placeholder="Describe the granite variant characteristics..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              placeholder="https://example.com/images/granite.jpg"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              type="url"
            />
          </div>

          <div className="flex justify-end gap-2">
            {onClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : isEditing ? 'Update Variant' : 'Create Variant'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function GraniteVariantTrigger({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Button size="sm" onClick={onCreateClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Base Variant
    </Button>
  );
}
