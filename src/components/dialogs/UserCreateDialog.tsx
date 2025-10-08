import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { tierApi } from '../../services/businessApi';
import { useNotifications } from '../../hooks/useNotifications';
import type { CreateUserData } from '../../types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserCreateDialog({ open, onOpenChange }: UserCreateDialogProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    password: '',
    role: 'customer',
    tier: 'T3',
    customDiscount: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // Query for available tiers
  const { data: tiersData } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => tierApi.getTiers(),
  });

  // Set default tier when tiers are loaded
  useEffect(() => {
    if (tiersData?.data?.tiers && tiersData.data.tiers.length > 0 && formData.tier === 'T3') {
      // Set to the first available tier (usually T1)
      setFormData(prev => ({
        ...prev,
        tier: tiersData.data!.tiers![0].tier
      }));
    }
  }, [tiersData, formData.tier]);

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserData) => userApi.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      addNotification({
        type: 'success',
        title: 'User Created',
        message: 'User has been created successfully',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.message || 'Failed to create user',
      });
    },
  });

  const resetForm = () => {
    const defaultTier = tiersData?.data?.tiers?.[0]?.tier || 'T3';
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      password: '',
      role: 'customer',
      tier: defaultTier,
      customDiscount: undefined,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      // Prepare data based on role
      const submitData = { ...formData };
      
      // Only include customer-specific fields if role is customer
      if (formData.role !== 'customer') {
        delete submitData.tier;
        delete submitData.customDiscount;
        delete submitData.company;
        delete submitData.address;
      }
      
      createUserMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: keyof CreateUserData, value: string | number | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear customer-specific fields when role is changed to non-customer
      if (field === 'role' && value !== 'customer') {
        newData.tier = '';
        newData.customDiscount = undefined;
        newData.company = '';
        newData.address = '';
      }
      // Set default tier when role is changed to customer
      else if (field === 'role' && value === 'customer') {
        const defaultTier = tiersData?.data?.tiers?.[0]?.tier || 'T3';
        newData.tier = defaultTier;
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <p className="text-sm text-gray-600">
            Add a new user to the system. Fields marked with * are required. 
            {formData.role === 'customer' ? 
              'Customer-specific fields (tier, discount, company, address) are available below.' :
              'Administrative users only need basic information (name, email, password, role).'
            }
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

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address *</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
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

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'staff' | 'customer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Tier - Only for customers */}
              {formData.role === 'customer' && (
                <div className="space-y-2">
                  <label htmlFor="tier" className="text-sm font-medium">Tier</label>
                  <select
                    id="tier"
                    value={formData.tier}
                    onChange={(e) => handleInputChange('tier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tiersData?.data?.tiers?.map((tier) => (
                      <option key={tier._id} value={tier.tier}>
                        {tier.tier} - {tier.description} ({tier.discountPercent}% discount)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Discount - Only for customers */}
              {formData.role === 'customer' && (
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
              )}
            </div>

            {/* Company - Only for customers */}
            {formData.role === 'customer' && (
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">Company</label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
            )}

            {/* Address - Only for customers */}
            {formData.role === 'customer' && (
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
            )}

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password *</label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter secure password (min 8 characters)"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
