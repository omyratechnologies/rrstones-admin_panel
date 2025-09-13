import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { permissionApi } from '../../services/api/permissionApi';
import { useNotifications } from '../../hooks/useNotifications';

interface PermissionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const modules = [
  { value: 'users', label: 'User Management' },
  { value: 'orders', label: 'Order Management' },
  { value: 'products', label: 'Product Management' },
  { value: 'analytics', label: 'Analytics & Reports' },
  { value: 'system', label: 'System Settings' },
  { value: 'tiers', label: 'Tier Management' },
];

export default function PermissionCreateDialog({ open, onOpenChange }: PermissionCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    module: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const createMutation = useMutation({
    mutationFn: permissionApi.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      addNotification({
        type: 'success',
        title: 'Permission Created',
        message: 'Permission has been created successfully',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create permission',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      module: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Permission name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Permission code is required';
    } else if (!/^[A-Z_]+$/.test(formData.code)) {
      newErrors.code = 'Code must be uppercase with underscores only';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.module) {
      newErrors.module = 'Please select a module';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate(formData);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    // Auto-generate code from name
    const code = value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
    setFormData(prev => ({ ...prev, code }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Create New Permission</CardTitle>
          <p className="text-sm text-gray-600">
            Add a new permission to the system. This will allow you to control access to specific features.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission Name</label>
              <Input
                placeholder="e.g., Create Users"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              <p className="text-xs text-gray-500">A human-readable name for this permission</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Permission Code</label>
              <Input
                placeholder="e.g., CREATE_USERS"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              <p className="text-xs text-gray-500">Unique code used in the system (auto-generated from name)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <select
                value={formData.module}
                onChange={(e) => setFormData(prev => ({ ...prev, module: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md ${errors.module ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a module</option>
                {modules.map((module) => (
                  <option key={module.value} value={module.value}>
                    {module.label}
                  </option>
                ))}
              </select>
              {errors.module && <p className="text-sm text-red-500">{errors.module}</p>}
              <p className="text-xs text-gray-500">Which part of the system this permission controls</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe what this permission allows users to do..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md resize-none h-20 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              <p className="text-xs text-gray-500">Detailed explanation of what this permission grants</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Permission'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
