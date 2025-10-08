import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Shield, UserCog, Settings, BarChart3, Package, ShoppingCart, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { permissionApi } from '../../services/api/permissionApi';

// Import components
import PermissionCreateDialog from '@/components/dialogs/PermissionCreateDialog';
import RoleCreateDialog from '@/components/dialogs/RoleCreateDialog';
import UserRoleManagement from '@/components/admin/UserRoleManagement';

export default function PermissionManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Queries
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAllPermissions(),
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionApi.getAllRoles(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['permission-analytics'],
    queryFn: () => permissionApi.getPermissionAnalytics(),
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to load analytics data'
    }
  });

  // Get module icon
  const getModuleIcon = (module: string) => {
    const icons = {
      users: UserCog,
      orders: ShoppingCart,
      products: Package,
      analytics: BarChart3,
      system: Settings,
      tiers: Shield
    };
    const IconComponent = icons[module as keyof typeof icons] || Settings;
    return <IconComponent className="h-4 w-4" />;
  };

  // Get role color
  const getRoleColor = (code: string) => {
    const colors = {
      customer: 'bg-muted text-foreground',
      staff: 'bg-success-light text-success',
      admin: 'bg-primary-light text-primary',
      super_admin: 'bg-error-light text-error'
    };
    return colors[code as keyof typeof colors] || 'bg-muted text-foreground';
  };

  // Filter permissions by search term
  const filteredPermissions = Object.entries((permissionsData as any)?.data?.permissions || {}).reduce((acc, [module, perms]) => {
    const filtered = (perms as any[]).filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[module] = filtered;
    }
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, roles, permissions, and access control
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {activeTab === 'permissions' && (
            <>
              <Button variant="outline" onClick={() => setRoleDialogOpen(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Add Role
              </Button>
              <Button onClick={() => setPermissionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Permission
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* User Management Tab */}
        <TabsContent value="users">
          <UserRoleManagement />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          {/* Analytics Cards for Permissions */}
          {(analyticsData as any)?.data?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(analyticsData as any).data.summary.totalPermissions || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys((analyticsData as any).data.byModule || {}).length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Permission Usage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions List */}
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Settings className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading permissions...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredPermissions).map(([module, permissions]) => (
                <Card key={module}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getModuleIcon(module)}
                      <CardTitle className="capitalize">{module}</CardTitle>
                      <Badge variant="secondary">{(permissions as any[]).length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(permissions as any[]).map((permission: any) => (
                        <div key={permission._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{permission.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {permission.code}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {Object.keys(filteredPermissions).length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No permissions found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <UserCog className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading roles...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(rolesData as any)?.data?.roles?.map((role: any) => (
                <Card key={role._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {role.name}
                      </CardTitle>
                      <Badge className={getRoleColor(role.code)}>
                        Level {role.hierarchy}
                      </Badge>
                    </div>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Permissions ({role.permissions.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 6).map((permission: string) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 6 && (
                            <Badge variant="secondary" className="text-xs">
                              +{role.permissions.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      {role.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          System Role
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {(analyticsData as any)?.data ? (
            <div className="space-y-6">
              {/* Role Distribution */}
              {(analyticsData as any).data.roleDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution by Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries((analyticsData as any).data.roleDistribution).map(([role, count]) => (
                        <div key={role} className="text-center">
                          <div className="text-2xl font-bold">{count as number}</div>
                          <div className={`text-sm px-2 py-1 rounded capitalize ${getRoleColor(role)}`}>
                            {role.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analyticsData as any)?.data?.summary?.totalPermissions || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analyticsData as any)?.data?.summary?.totalRoles || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analyticsData as any)?.data?.summary?.totalUsers || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Permissions */}
              {(analyticsData as any).data.topPermissions && (analyticsData as any).data.topPermissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Most Assigned Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(analyticsData as any).data.topPermissions.map((item: any, index: number) => (
                        <div key={item._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{item._id}</span>
                          </div>
                          <Badge variant="secondary">{item.count} users</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Analytics Loading</h3>
                <p className="text-muted-foreground">Analytics data will be available shortly.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PermissionCreateDialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
      />
      
      <RoleCreateDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
    </div>
  );
}
