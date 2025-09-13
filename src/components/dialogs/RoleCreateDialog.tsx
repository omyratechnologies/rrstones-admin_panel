import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { permissionApi } from '../../services/api/permissionApi';
import { useNotifications } from '../../hooks/useNotifications';
import { Shield, Check } from 'lucide-react';

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoleCreateDialog({ open, onOpenChange }: RoleCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
    hierarchy: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // Fetch all permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAllPermissions(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: permissionApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({
        type: 'success',
        title: 'Role Created',
        message: 'Role has been created successfully',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create role',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      permissions: [],
      hierarchy: 1,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Role code is required';
    } else if (!/^[a-z_]+$/.test(formData.code)) {
      newErrors.code = 'Code must be lowercase with underscores only';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Please select at least one permission';
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
    const code = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    setFormData(prev => ({ ...prev, code }));
  };

  const togglePermission = (permissionCode: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionCode)
        ? prev.permissions.filter(p => p !== permissionCode)
        : [...prev.permissions, permissionCode]
    }));
  };

  const selectAllInModule = (_module: string, permissions: any[]) => {
    const modulePermissions = permissions.map(p => p.code);
    const allSelected = modulePermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Deselect all in module
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !modulePermissions.includes(p))
      }));
    } else {
      // Select all in module
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissions])]
      }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create New Role
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create a new role and assign permissions to control access to different features.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role Name</label>
                <Input
                  placeholder="e.g., Content Manager"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role Code</label>
                <Input
                  placeholder="e.g., content_manager"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hierarchy Level</label>
              <select
                value={formData.hierarchy}
                onChange={(e) => setFormData(prev => ({ ...prev, hierarchy: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={1}>Level 1 - Customer</option>
                <option value={2}>Level 2 - Staff</option>
                <option value={3}>Level 3 - Admin</option>
                <option value={4}>Level 4 - Super Admin</option>
              </select>
              <p className="text-xs text-gray-500">Higher levels inherit permissions from lower levels</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe this role and its responsibilities..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md resize-none h-20 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Permissions</label>
                <Badge variant="secondary">
                  {formData.permissions.length} selected
                </Badge>
              </div>
              {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}

              {(permissionsData as any)?.data?.permissions && (
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {Object.entries((permissionsData as any).data.permissions).map(([module, permissions]) => {
                    const modulePermissions = permissions as any[];
                    const moduleSelected = modulePermissions.filter(p => formData.permissions.includes(p.code)).length;
                    const allSelected = moduleSelected === modulePermissions.length;
                    
                    return (
                      <div key={module} className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium capitalize">{module}</h3>
                            <Badge variant="outline">
                              {moduleSelected}/{modulePermissions.length}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInModule(module, modulePermissions)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePermissions.map((permission: any) => {
                            const isSelected = formData.permissions.includes(permission.code);
                            return (
                              <div
                                key={permission._id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => togglePermission(permission.code)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-medium">{permission.name}</h4>
                                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {permission.code}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                {createMutation.isPending ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
