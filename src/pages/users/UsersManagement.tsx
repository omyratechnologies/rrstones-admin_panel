import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Download, Edit, Trash2, Mail, Users, RefreshCw, Shield, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userApi } from '../../services/api';
import { tierApi } from '../../services/businessApi';
import { useNotifications } from '../../hooks/useNotifications';
import type { User, UserFilters } from '../../types';

// Import dialogs
import UserCreateDialog from '../../components/dialogs/UserCreateDialog';
import UserEditDialog from '../../components/dialogs/UserEditDialog';
import UserMessageDialog from '../../components/dialogs/UserMessageDialog';

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    tier: '',
    isActive: undefined,
    page: 1,
    limit: 10,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // Query for users data - All users (including customers)
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', { ...filters, includeCustomers: 'true' }],
    queryFn: () => userApi.getUsers({ ...filters, includeCustomers: 'true' }),
  });

  // Query for admin users (both admin and super_admin)
  const { data: adminUsersData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['users', 'admins', { ...filters, role: 'admins' }],
    queryFn: () => userApi.getUsers({ ...filters, role: 'admins' }),
  });

  // Query for customer users only
  const { data: customerUsersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['users', 'customer', { ...filters, role: 'customer' }],
    queryFn: () => userApi.getUsers({ ...filters, role: 'customer', includeCustomers: 'true' }),
  });

  // Query for user statistics
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => userApi.getDashboardStats(),
  });

  // Query for available tiers
  const { data: tiersData } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => tierApi.getTiers(),
  });

  // Mutations for user operations
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userApi.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({
        type: 'success',
        title: 'User Status Updated',
        message: 'User status has been updated successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update user status',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      addNotification({
        type: 'success',
        title: 'User Deleted',
        message: 'User has been deleted successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.response?.data?.message || 'Failed to delete user',
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ userIds, action }: { userIds: string[]; action: 'delete' | 'activate' | 'deactivate' }) =>
      userApi.bulkUserAction(userIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setSelectedUsers([]);
      addNotification({
        type: 'success',
        title: 'Bulk Action Completed',
        message: 'Bulk action has been completed successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Bulk Action Failed',
        message: error.response?.data?.message || 'Failed to complete bulk action',
      });
    },
  });

  const exportUsersMutation = useMutation({
    mutationFn: (format: 'csv' | 'excel') => userApi.exportUsers(format),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Export Started',
        message: 'Users data export has been initiated',
      });
    },
  });

  // Data processing
  const users = usersData?.data?.users || [];
  const totalPages = usersData?.data?.pagination?.total || 1;
  const currentPage = usersData?.data?.pagination?.current || 1;
  const stats = statsData?.data || {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalCustomers: 0,
    totalAdmins: 0,
  };

  // Event handlers
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      addNotification({
        type: 'error',
        title: 'No Selection',
        message: 'Please select users to perform bulk action',
      });
      return;
    }

    bulkActionMutation.mutate({
      userIds: selectedUsers,
      action: action,
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleSendMessage = (user: User) => {
    setSelectedUser(user);
    setMessageDialogOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    const currentUsers = getCurrentTabData(activeTab);
    setSelectedUsers(prev =>
      prev.length === currentUsers.length ? [] : currentUsers.map((user: User) => user._id)
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'T1':
        return 'bg-yellow-100 text-yellow-800';
      case 'T2':
        return 'bg-orange-100 text-orange-800';
      case 'T3':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get data and loading state based on active tab
  const getTabData = (tab: string) => {
    switch (tab) {
      case 'admins':
        return { data: adminUsersData, isLoading: isLoadingAdmins };
      case 'customers':
        return { data: customerUsersData, isLoading: isLoadingCustomers };
      default:
        return { data: usersData, isLoading };
    }
  };

  const getCurrentTabData = (tab: string) => {
    const { data } = getTabData(tab);
    return data?.data?.users || [];
  };

  const getCurrentTabLoading = (tab: string) => {
    const { isLoading: loading } = getTabData(tab);
    return loading;
  };

  // Handle tab change and clear selections
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedUsers([]); // Clear selections when switching tabs
  };

  // Helper component for rendering users list
  const renderUsersList = (tabUsers: User[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading users...</span>
        </div>
      );
    }

    if (tabUsers.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tabUsers.map((user: User) => (
          <div
            key={user._id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user._id)}
                onChange={() => toggleUserSelection(user._id)}
                className="rounded h-4 w-4"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                      user.tier
                    )}`}
                  >
                    {user.tier}
                  </span>
                  {!user.isActive && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                  {user.customDiscount && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {user.customDiscount}% Discount
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{user.email}</span>
                  {user.phone && <span>{user.phone}</span>}
                  {user.company && <span>{user.company}</span>}
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  if (user.isActive) {
                    updateUserStatusMutation.mutate({ id: user._id, isActive: false });
                  } else {
                    updateUserStatusMutation.mutate({ id: user._id, isActive: true });
                  }
                }}
                variant={user.isActive ? "outline" : "default"}
                size="sm"
                className={user.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 bg-green-50 hover:bg-green-100"}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                onClick={() => handleEditUser(user)}
                variant="outline"
                size="sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage(user)}
                variant="outline"
                size="sm"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this user?')) {
                    deleteUserMutation.mutate(user._id);
                  }
                }}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all users in your system with advanced features
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => exportUsersMutation.mutate('csv')}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Advanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Customer accounts</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced User Filters</CardTitle>
          <CardDescription>
            Powerful search and filtering with bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, phone, or company..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Role Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <Select 
                  value={filters.role || "all_roles"} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    role: value === "all_roles" ? "" : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_roles">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tier Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Tier
                </label>
                <Select 
                  value={filters.tier || "all_tiers"} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    tier: value === "all_tiers" ? "" : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_tiers">All Tiers</SelectItem>
                    {tiersData?.data?.tiers?.map((tier) => (
                      <SelectItem key={tier._id} value={tier.tier}>
                        {tier.tier} - {tier.description} ({tier.discountPercent}% discount)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <Select 
                  value={filters.isActive === undefined ? "all_status" : filters.isActive.toString()} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    isActive: value === "all_status" ? undefined : value === "true" 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_status">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={toggleAllUsers}
                  variant="outline"
                  size="sm"
                >
                  {selectedUsers.length === getCurrentTabData(activeTab).length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedUsers.length > 0 && (
                  <span className="text-sm text-muted-foreground self-center">
                    {selectedUsers.length} selected
                  </span>
                )}
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleBulkAction('activate')}
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Activate ({selectedUsers.length})
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('deactivate')}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Deactivate ({selectedUsers.length})
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('delete')}
                    variant="destructive"
                    size="sm"
                  >
                    Delete ({selectedUsers.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Users List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                Organize users by role and manage with advanced features
              </CardDescription>
            </div>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Users ({stats.totalUsers})
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Administrators ({stats.totalAdmins})
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Customers ({stats.totalCustomers})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {getCurrentTabData('all').length} of {stats.totalUsers} users
                </p>
              </div>
              {renderUsersList(
                getCurrentTabData('all'),
                getCurrentTabLoading('all'),
                'Try adjusting your search or filters'
              )}
            </TabsContent>

            <TabsContent value="admins" className="mt-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {getCurrentTabData('admins').length} of {stats.totalAdmins} administrators
                </p>
              </div>
              {renderUsersList(
                getCurrentTabData('admins'),
                getCurrentTabLoading('admins'),
                'No administrators found with current filters'
              )}
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {getCurrentTabData('customers').length} of {stats.totalCustomers} customers
                </p>
              </div>
              {renderUsersList(
                getCurrentTabData('customers'),
                getCurrentTabLoading('customers'),
                'No customers found with current filters'
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {currentPage || 1} of {totalPages} • Showing {users.length} users
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setFilters({ ...filters, page: 1 })}
                  disabled={filters.page === 1}
                  variant="outline"
                  size="sm"
                >
                  First
                </Button>
                <Button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, (currentPage || 1) - 1) })}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 px-3">
                  {currentPage || 1} of {totalPages}
                </span>
                <Button
                  onClick={() => setFilters({ ...filters, page: Math.min(totalPages, (currentPage || 1) + 1) })}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
                <Button
                  onClick={() => setFilters({ ...filters, page: totalPages })}
                  disabled={filters.page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Last
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <UserCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      <UserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
      />
      
      <UserMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}