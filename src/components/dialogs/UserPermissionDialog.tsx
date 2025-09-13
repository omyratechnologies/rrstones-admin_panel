import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { permissionApi } from '../../services/api/permissionApi';
import { UserCog, Check } from 'lucide-react';

interface UserPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export default function UserPermissionDialog({ open, onOpenChange, user }: UserPermissionDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const queryClient = useQueryClient();

  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    // Simple notification - can be enhanced with a toast library
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    // You can replace this with your preferred notification system
  };

  // Fetch user's current permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', user?._id],
    queryFn: () => permissionApi.getUserPermissions(user._id),
    enabled: open && !!user?._id,
  });

  // Fetch all permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAllPermissions(),
    enabled: open,
  });

  // Fetch all roles
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionApi.getAllRoles(),
    enabled: open,
  });

  // Debug logs
  console.log('Roles data:', rolesData);
  console.log('Permissions data:', permissionsData);
  console.log('User permissions:', userPermissions);

  const assignMutation = useMutation({
    mutationFn: (data: { permissions: string[]; role?: string }) => 
      permissionApi.assignUserPermissions(user._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', user._id] });
      showNotification('success', 'Permissions Updated', 'User permissions have been updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      showNotification('error', 'Update Failed', error.response?.data?.message || 'Failed to update permissions');
    },
  });

  useEffect(() => {
    if (open && user) {
      // Initialize role from user object
      setSelectedRole(user.role || '');
      
      // Initialize permissions from user permissions response or user object
      const userPermsData = userPermissions as any;
      let permissions: string[] = [];
      
      if (userPermsData?.data?.permissions && Array.isArray(userPermsData.data.permissions)) {
        permissions = userPermsData.data.permissions;
      } else if (user.permissions && Array.isArray(user.permissions)) {
        permissions = user.permissions;
      }
      
      setSelectedPermissions(permissions);
    }
  }, [userPermissions, user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignMutation.mutate({
      permissions: selectedPermissions,
      role: selectedRole,
    });
  };

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissions(prev => {
      const currentPerms = Array.isArray(prev) ? prev : [];
      return currentPerms.includes(permissionCode)
        ? currentPerms.filter(p => p !== permissionCode)
        : [...currentPerms, permissionCode];
    });
  };

  const selectAllInModule = (permissions: any[]) => {
    const modulePermissions = permissions.map(p => p.code);
    const currentPermissions = Array.isArray(selectedPermissions) ? selectedPermissions : [];
    const allSelected = modulePermissions.every(p => currentPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => (Array.isArray(prev) ? prev : []).filter(p => !modulePermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...(Array.isArray(prev) ? prev : []), ...modulePermissions])]);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Manage User Permissions - {user.name}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Assign permissions and role to control what this user can access.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {user.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Current Role:</span> 
                  <Badge className="ml-2" variant="outline">{user.role}</Badge>
                </div>
                <div>
                  <span className="font-medium">Status:</span> {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={rolesLoading}
              >
                <option value="">
                  {rolesLoading ? 'Loading roles...' : 'Select a role...'}
                </option>
                {(rolesData as any)?.data?.roles?.map((role: any) => (
                  <option key={role._id} value={role.code}>
                    {role.name} (Level {role.hierarchy})
                  </option>
                ))}
                {!rolesLoading && (!(rolesData as any)?.data?.roles || (rolesData as any)?.data?.roles?.length === 0) && (
                  <option value="" disabled>No roles available</option>
                )}
              </select>
              <p className="text-xs text-gray-500">
                Role will automatically grant associated permissions
              </p>
              {rolesError && (
                <p className="text-xs text-red-500">
                  Error loading roles: {rolesError.message}
                </p>
              )}
            </div>

            {/* Individual Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Additional Permissions</label>
                <Badge variant="secondary">
                  {selectedPermissions.length} selected
                </Badge>
              </div>

              {(permissionsData as any)?.data?.permissions && (
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {Object.entries((permissionsData as any).data.permissions).map(([module, permissions]) => {
                    const modulePermissions = permissions as any[];
                    const currentPermissions = Array.isArray(selectedPermissions) ? selectedPermissions : [];
                    const moduleSelected = modulePermissions.filter(p => currentPermissions.includes(p.code)).length;
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
                            onClick={() => selectAllInModule(modulePermissions)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePermissions.map((permission: any) => {
                            const currentPermissions = Array.isArray(selectedPermissions) ? selectedPermissions : [];
                            const isSelected = currentPermissions.includes(permission.code);
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
                disabled={assignMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending}
                className="flex-1"
              >
                {assignMutation.isPending ? 'Updating...' : 'Update Permissions'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
