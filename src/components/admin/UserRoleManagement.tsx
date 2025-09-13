import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, UserCog, Edit, Key, Users } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { userApi, permissionApi } from '../../services/api';
import UserPermissionDialog from '../dialogs/UserPermissionDialog';
import type { User as BaseUser } from '../../types';

interface User extends BaseUser {
  permissions?: string[];
}

export default function UserRoleManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch users (excluding customers by default)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', searchTerm, selectedRole],
    queryFn: () => userApi.getUsers({ 
      search: searchTerm || undefined, 
      role: selectedRole !== 'all' ? selectedRole : undefined,
      includeCustomers: 'false' // Always exclude customers from admin panel
    }),
  });

  // Fetch roles for filtering
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionApi.getAllRoles(),
  });

  // Bulk role assignment mutation
  const bulkRoleAssignMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      const promises = userIds.map(userId => 
        permissionApi.assignUserPermissions(userId, { permissions: [], role })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setBulkActionMode(false);
      setSelectedUsers([]);
      alert('Bulk role assignment completed successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to assign roles: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  // Toggle user selection for bulk operations
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle opening permission dialog
  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionDialogOpen(true);
  };

  // Quick role assignment
  const quickRoleAssign = async (userId: string, role: string) => {
    try {
      await permissionApi.assignUserPermissions(userId, { permissions: [], role });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert(`Role updated to ${role} successfully!`);
    } catch (error: any) {
      alert(`Failed to update role: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colors = {
      customer: 'bg-gray-100 text-gray-800',
      staff: 'bg-green-100 text-green-800',
      admin: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-red-100 text-red-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Filter users
  const filteredUsers = usersData?.data?.users?.filter((user: User) => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User & Role Management</h1>
          <p className="text-gray-600">
            Manage user roles, permissions, and access control
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant={bulkActionMode ? "destructive" : "outline"}
            onClick={() => {
              setBulkActionMode(!bulkActionMode);
              setSelectedUsers([]);
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            {bulkActionMode ? 'Cancel Bulk' : 'Bulk Actions'}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="lg:w-48">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Roles</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel */}
      {bulkActionMode && selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex gap-2">
                  {(rolesData as any)?.data?.roles?.map((role: any) => (
                    <Button
                      key={role.code}
                      size="sm"
                      variant="outline"
                      onClick={() => bulkRoleAssignMutation.mutate({
                        userIds: selectedUsers,
                        role: role.code
                      })}
                      disabled={bulkRoleAssignMutation.isPending}
                    >
                      Assign {role.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <UserCog className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user: User) => (
                <div
                  key={user._id}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedUsers.includes(user._id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {bulkActionMode && (
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="w-4 h-4"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div><strong>Email:</strong> {user.email}</div>
                          <div><strong>Phone:</strong> {user.phone}</div>
                          <div><strong>Company:</strong> {user.company || 'N/A'}</div>
                          <div><strong>Tier:</strong> {user.tier}</div>
                          <div><strong>Permissions:</strong> {user.permissions?.length || 0}</div>
                          <div><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    {!bulkActionMode && (
                      <div className="flex items-center gap-2">
                        {/* Quick Role Assignment */}
                        <div className="flex gap-1">
                          {(rolesData as any)?.data?.roles?.map((role: any) => (
                            <Button
                              key={role.code}
                              size="sm"
                              variant={user.role === role.code ? "default" : "outline"}
                              onClick={() => quickRoleAssign(user._id, role.code)}
                              disabled={user.role === role.code}
                              className="text-xs px-2 py-1"
                            >
                              {role.name}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPermissions(user)}
                        >
                          <Key className="mr-1 h-3 w-3" />
                          Permissions
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Dialog */}
      {selectedUser && (
        <UserPermissionDialog
          open={permissionDialogOpen}
          onOpenChange={setPermissionDialogOpen}
          user={selectedUser}
        />
      )}
    </div>
  );
}
