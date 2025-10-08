import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Users, 
  Navigation as NavigationIcon,
  Palette,
  Flag,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePermissionStore } from '@/stores/permissionStore';
import { configApi, configQueries } from '@/services/configApi';

const ConfigurationPanel: React.FC = () => {
  const { hasPermission } = usePermissionStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Permissions check
  const canManageConfig = hasPermission('manage_configuration');
  const canManageRoles = hasPermission('manage_roles');
  const canManagePermissions = hasPermission('manage_permissions');

  if (!canManageConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-16 w-16 text-orange-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access configuration settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-gray-600 mt-2">Manage system settings, permissions, and features</p>
        </div>
        <ConfigurationActions />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ConfigurationOverview />
        </TabsContent>

        <TabsContent value="permissions">
          {canManagePermissions ? <PermissionsManager /> : <AccessDeniedCard />}
        </TabsContent>

        <TabsContent value="roles">
          {canManageRoles ? <RolesManager /> : <AccessDeniedCard />}
        </TabsContent>

        <TabsContent value="navigation">
          <NavigationManager />
        </TabsContent>

        <TabsContent value="features">
          <FeatureFlagsManager />
        </TabsContent>

        <TabsContent value="themes">
          <ThemesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Configuration Actions Component
const ConfigurationActions: React.FC = () => {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const exportMutation = useMutation({
    mutationFn: configApi.exportConfig,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  const importMutation = useMutation({
    mutationFn: configApi.importConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueries.appConfig });
      setImporting(false);
    }
  });

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImporting(true);
      importMutation.mutate(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => exportMutation.mutate()}
        disabled={exportMutation.isPending}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Config
      </Button>
      
      <div className="relative">
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={importing}
        />
        <Button variant="outline" disabled={importing}>
          <Upload className="h-4 w-4 mr-2" />
          Import Config
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={() => queryClient.invalidateQueries()}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};

// Configuration Overview Component
const ConfigurationOverview: React.FC = () => {
  const { data: appConfig } = useQuery({
    queryKey: configQueries.appConfig,
    queryFn: configApi.getAppConfig
  });

  const { data: configHealth } = useQuery({
    queryKey: ['config-health'],
    queryFn: configApi.getConfigHealth,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <CheckCircle className={`h-4 w-4 ${configHealth?.status === 'healthy' ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {configHealth?.status || 'Unknown'}
          </div>
          <p className="text-xs text-muted-foreground">
            Overall system health
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">App Version</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appConfig?.version || '1.0.0'}</div>
          <p className="text-xs text-muted-foreground">
            Current application version
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Features</CardTitle>
          <Flag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {appConfig?.features?.filter(f => f.isEnabled).length || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Enabled feature flags
          </p>
        </CardContent>
      </Card>

      {configHealth?.checks && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Health Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(configHealth.checks).map(([check, status]) => (
                <div key={check} className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm capitalize">{check.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Permissions Manager Component
const PermissionsManager: React.FC = () => {
  const { data: permissions } = useQuery({
    queryKey: configQueries.permissions,
    queryFn: configApi.getPermissions
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissions Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {permissions?.map((permission) => (
            <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{permission.name}</h3>
                {permission.description && (
                  <p className="text-sm text-gray-600">{permission.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{permission.resource}</Badge>
                  <Badge variant="outline">{permission.action}</Badge>
                  {permission.scope && <Badge variant="secondary">{permission.scope}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Roles Manager Component
const RolesManager: React.FC = () => {
  const { data: roles } = useQuery({
    queryKey: configQueries.roles,
    queryFn: configApi.getRoles
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Roles Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles?.map((role) => (
            <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{role.name}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{role.permissions.length} permissions</Badge>
                  <Badge variant={role.isDefault ? 'default' : 'secondary'}>
                    {role.isDefault ? 'Default' : 'Custom'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Navigation Manager Component
const NavigationManager: React.FC = () => {
  const { data: navigation } = useQuery({
    queryKey: configQueries.navigation,
    queryFn: configApi.getNavigation
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NavigationIcon className="h-5 w-5" />
          Navigation Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {navigation?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{item.label}</h3>
                <p className="text-sm text-gray-600">{item.href || item.path}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">Order: {item.order}</Badge>
                  {item.requiredPermissions && (
                    <Badge variant="secondary">{item.requiredPermissions.length} permissions</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.enabled || item.isVisible} />
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Feature Flags Manager Component
const FeatureFlagsManager: React.FC = () => {
  const { data: featureFlags } = useQuery({
    queryKey: configQueries.featureFlags,
    queryFn: configApi.getFeatureFlags
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature Flags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featureFlags?.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{flag.name}</h3>
                <p className="text-sm text-gray-600">{flag.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                    {flag.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {flag.environment && <Badge variant="outline">{flag.environment}</Badge>}
                </div>
              </div>
              <Switch checked={flag.isEnabled} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Themes Manager Component
const ThemesManager: React.FC = () => {
  const { data: themes } = useQuery({
    queryKey: configQueries.themes,
    queryFn: configApi.getThemes
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Themes Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes?.map((theme) => (
            <div key={theme.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{theme.name}</h3>
              {theme.description && (
                <p className="text-sm text-gray-600 mb-4">{theme.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.variables.primary }}
                  />
                  <span className="text-xs">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.variables.secondary }}
                  />
                  <span className="text-xs">Secondary</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <Badge variant={theme.isDefault ? 'default' : 'secondary'}>
                  {theme.isDefault ? 'Default' : 'Custom'}
                </Badge>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Access Denied Card Component
const AccessDeniedCard: React.FC = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
      <p className="text-gray-600 text-center">
        You don't have permission to manage this section.
      </p>
    </CardContent>
  </Card>
);

export default ConfigurationPanel;
