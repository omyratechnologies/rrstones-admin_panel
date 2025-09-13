import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import type { User } from '../../types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserEditDialog({ open, onOpenChange, user }: UserEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
    tier: 'T3' as 'T1' | 'T2' | 'T3',
    customDiscount: undefined as number | undefined,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
        tier: user.tier,
        customDiscount: user.customDiscount,
        isActive: user.isActive,
      });
      setErrors({});
    }
  }, [user, open]);

  const updateUserMutation = useMutation({
    mutationFn: (userData: Partial<User>) => userApi.updateUser(user!._id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      addNotification({
        type: 'success',
        title: 'User Updated',
        message: 'User has been updated successfully',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update user',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.customDiscount && (formData.customDiscount < 0 || formData.customDiscount > 100)) {
      newErrors.customDiscount = 'Custom discount must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateUserMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit User: {user.name}</CardTitle>
          <p className="text-sm text-gray-600">
            Update user information. Email cannot be changed.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Role (Read-only for security) */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <Input
                  id="role"
                  value={user.role.replace('_', ' ').toUpperCase()}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Role cannot be changed here</p>
              </div>

              {/* Tier */}
              <div className="space-y-2">
                <label htmlFor="tier" className="text-sm font-medium">Tier</label>
                <select
                  id="tier"
                  value={formData.tier}
                  onChange={(e) => handleInputChange('tier', e.target.value as 'T1' | 'T2' | 'T3')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="T1">T1 - Premium (20% discount)</option>
                  <option value="T2">T2 - Standard (15% discount)</option>
                  <option value="T3">T3 - Basic (5% discount)</option>
                </select>
              </div>

              {/* Custom Discount */}
              <div className="space-y-2">
                <label htmlFor="customDiscount" className="text-sm font-medium">Custom Discount (%)</label>
                <Input
                  id="customDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.customDiscount || ''}
                  onChange={(e) => handleInputChange('customDiscount', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional custom discount"
                  className={errors.customDiscount ? 'border-red-500' : ''}
                />
                {errors.customDiscount && <p className="text-sm text-red-500">{errors.customDiscount}</p>}
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Company</label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">Address</label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Status</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm">Active Account</label>
              </div>
              <p className="text-xs text-gray-500">
                Inactive accounts cannot log in or place orders
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
