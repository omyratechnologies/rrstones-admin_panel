import apiService from './apiService';
import type { 
  AppConfig, 
  Permission, 
  Role, 
  NavigationItem, 
  DynamicSetting, 
  FeatureFlag,
  ThemeConfig
} from '@/types/dynamic';

export const configApi = {
  // Get complete app configuration (mock for now)
  getAppConfig: async (): Promise<AppConfig> => {
    // This would combine data from multiple sources
    return {
      version: '1.0.0',
      ui: [],
      navigation: [], // Will be built from permissions
      settings: [],
      features: [],
      workflows: [],
      api: [],
      themes: [],
      currentTheme: 'default',
      lastUpdated: new Date().toISOString()
    };
  },

  // Update app configuration
  updateAppConfig: async (config: Partial<AppConfig>): Promise<AppConfig> => {
    // Mock implementation
    return config as AppConfig;
  },

  // Permissions management - matches backend API
  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiService.get<{ success: boolean; data: any }>('/permissions');
    
    // Transform backend format to frontend format
    const permissions: Permission[] = [];
    if (response.data.permissions) {
      Object.values(response.data.permissions).forEach((modulePerms: any) => {
        modulePerms.forEach((perm: any) => {
          permissions.push({
            id: perm._id,
            name: perm.name,
            description: perm.description,
            resource: perm.module,
            action: perm.code.toLowerCase(),
            scope: perm.module,
            conditions: {},
            createdAt: new Date(perm.createdAt),
            updatedAt: new Date(perm.updatedAt)
          });
        });
      });
    }
    
    return permissions;
  },

  createPermission: async (permission: Omit<Permission, 'id'>): Promise<Permission> => {
    const response = await apiService.post<{ success: boolean; data: any }>('/permissions', {
      name: permission.name,
      code: permission.action.toUpperCase(),
      description: permission.description,
      module: permission.resource
    });
    
    return {
      id: response.data._id,
      name: response.data.name,
      description: response.data.description,
      resource: response.data.module,
      action: response.data.code.toLowerCase(),
      scope: response.data.module,
      conditions: {},
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  updatePermission: async (id: string, permission: Partial<Permission>): Promise<Permission> => {
    const response = await apiService.put<{ success: boolean; data: any }>(`/permissions/${id}`, {
      name: permission.name,
      description: permission.description,
      module: permission.resource
    });
    
    return {
      id: response.data._id,
      name: response.data.name,
      description: response.data.description,
      resource: response.data.module,
      action: response.data.code.toLowerCase(),
      scope: response.data.module,
      conditions: {},
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  deletePermission: async (id: string): Promise<void> => {
    await apiService.delete(`/permissions/${id}`);
  },

  // Roles management - matches backend API
  getRoles: async (): Promise<Role[]> => {
    const response = await apiService.get<{ success: boolean; data: any[] }>('/permissions/roles');
    
    return response.data.map((role: any) => ({
      id: role._id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isDefault: role.code === 'customer',
      isSystemRole: role.isSystem,
      hierarchy: role.hierarchy,
      level: role.hierarchy,
      createdAt: new Date(role.createdAt),
      updatedAt: new Date(role.updatedAt)
    }));
  },

  createRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    const response = await apiService.post<{ success: boolean; data: any }>('/permissions/roles', {
      name: role.name,
      code: role.name.toLowerCase().replace(/\s+/g, '_'),
      description: role.description,
      permissions: role.permissions,
      hierarchy: role.hierarchy || 5
    });
    
    return {
      id: response.data._id,
      name: response.data.name,
      description: response.data.description,
      permissions: response.data.permissions,
      isDefault: false,
      isSystemRole: response.data.isSystem,
      hierarchy: response.data.hierarchy,
      level: response.data.hierarchy,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  updateRole: async (id: string, role: Partial<Role>): Promise<Role> => {
    const response = await apiService.put<{ success: boolean; data: any }>(`/permissions/roles/${id}`, {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      hierarchy: role.hierarchy
    });
    
    return {
      id: response.data._id,
      name: response.data.name,
      description: response.data.description,
      permissions: response.data.permissions,
      isDefault: false,
      isSystemRole: response.data.isSystem,
      hierarchy: response.data.hierarchy,
      level: response.data.hierarchy,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt)
    };
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiService.delete(`/permissions/roles/${id}`);
  },

  // Settings management - matches backend API
  getSettings: async (category?: string): Promise<any[]> => {
    try {
      const endpoint = category ? `/settings/category/${category}` : '/settings';
      const response = await apiService.get<{ success: boolean; data: any }>(endpoint);
      
      // Handle different response formats
      if (category) {
        // Category-specific request returns array directly
        return Array.isArray(response.data) ? response.data : [];
      } else {
        // All settings request returns grouped object, flatten it
        if (response.data && typeof response.data === 'object') {
          const allSettings: any[] = [];
          Object.values(response.data).forEach((categorySettings: any) => {
            if (Array.isArray(categorySettings)) {
              allSettings.push(...categorySettings);
            }
          });
          return allSettings;
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      return [];
    }
  },

  getSettingByKey: async (key: string): Promise<any> => {
    const response = await apiService.get<{ success: boolean; data: any }>(`/settings/${key}`);
    return response.data;
  },

  createSetting: async (setting: any): Promise<any> => {
    const response = await apiService.post<{ success: boolean; data: any }>('/settings', setting);
    return response.data;
  },

  updateSetting: async (key: string, value: any): Promise<any> => {
    const response = await apiService.put<{ success: boolean; data: any }>(`/settings/${key}`, { value });
    return response.data;
  },

  bulkUpdateSettings: async (settings: Array<{ key: string; value: any }>): Promise<any> => {
    const response = await apiService.post<{ success: boolean; data: any }>('/settings/bulk', { settings });
    return response.data;
  },

  deleteSetting: async (key: string): Promise<void> => {
    await apiService.delete(`/settings/${key}`);
  },

  // Navigation management (will be dynamic based on permissions)
  getNavigation: async (): Promise<NavigationItem[]> => {
    // This creates navigation based on user permissions
    
    const navigation: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        href: '/',
        icon: 'home',
        requiredPermissions: [],
        requiredRoles: [],
        children: [],
        isVisible: true,
        enabled: true,
        order: 1
      },
      {
        id: 'orders',
        label: 'Orders',
        path: '/orders',
        href: '/orders',
        icon: 'shopping-cart',
        requiredPermissions: ['orders:read'],
        requiredRoles: [],
        children: [],
        isVisible: true,
        enabled: true,
        order: 2
      },
      {
        id: 'products',
        label: 'Products',
        path: '/products',
        href: '/products',
        icon: 'package',
        requiredPermissions: ['products:read'],
        requiredRoles: [],
        children: [],
        isVisible: true,
        enabled: true,
        order: 3
      },
      {
        id: 'users',
        label: 'Users',
        path: '/users',
        href: '/users',
        icon: 'users',
        requiredPermissions: ['users:read'],
        requiredRoles: ['admin', 'super_admin'],
        children: [],
        isVisible: true,
        enabled: true,
        order: 4
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        href: '/analytics',
        icon: 'bar-chart',
        requiredPermissions: ['analytics:read'],
        requiredRoles: ['admin', 'super_admin'],
        children: [],
        isVisible: true,
        enabled: true,
        order: 5
      },
      {
        id: 'settings',
        label: 'Settings',
        path: '/settings',
        href: '/settings',
        icon: 'settings',
        requiredPermissions: ['settings:read'],
        requiredRoles: [],
        children: [],
        isVisible: true,
        enabled: true,
        order: 6
      }
    ];

    return navigation;
  },

  updateNavigation: async (navigation: NavigationItem[]): Promise<NavigationItem[]> => {
    // Mock implementation - would save to backend
    return navigation;
  },

  // Dynamic settings management
  getDynamicSettings: async (category?: string): Promise<DynamicSetting[]> => {
    const settings = await configApi.getSettings(category);
    
    // Transform backend settings to dynamic settings format
    return settings.map((setting: any) => ({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      scope: 'global' as const,
      category: setting.category,
      ui: {
        label: setting.key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
        description: setting.description || '',
        inputType: setting.type === 'boolean' ? 'toggle' : 'text' as const,
        group: setting.metadata?.group || 'general',
        order: setting.metadata?.order || 0,
        options: setting.validation?.enum?.map((val: string) => ({ value: val, label: val })) || []
      },
      validation: setting.validation,
      requiredPermissions: ['settings:write']
    }));
  },

  createDynamicSetting: async (setting: Omit<DynamicSetting, 'key'>): Promise<DynamicSetting> => {
    const response = await configApi.createSetting({
      key: `${setting.category}_${Date.now()}`,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      description: setting.ui.description,
      validation: setting.validation,
      metadata: {
        group: setting.ui.group,
        order: setting.ui.order
      }
    });
    
    return {
      key: response.key,
      value: response.value,
      type: response.type,
      scope: 'global',
      category: response.category,
      ui: setting.ui,
      validation: response.validation,
      requiredPermissions: ['settings:write']
    };
  },

  updateDynamicSetting: async (key: string, updates: Partial<DynamicSetting>): Promise<DynamicSetting> => {
    const response = await configApi.updateSetting(key, updates.value);
    
    return {
      key: response.key,
      value: response.value,
      type: response.type,
      scope: 'global',
      category: response.category,
      ui: updates.ui || {
        label: key,
        description: '',
        inputType: 'text',
        group: 'general',
        order: 0,
        options: []
      },
      validation: response.validation,
      requiredPermissions: ['settings:write']
    };
  },

  deleteDynamicSetting: async (key: string): Promise<void> => {
    await configApi.deleteSetting(key);
  },

  // Feature flags management (using settings)
  getFeatureFlags: async (): Promise<FeatureFlag[]> => {
    const settings = await configApi.getSettings('system');
    
    return settings
      .filter((setting: any) => setting.key.startsWith('feature_'))
      .map((setting: any) => ({
        key: setting.key.replace('feature_', ''),
        name: setting.key.replace('feature_', '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: setting.description || '',
        isEnabled: Boolean(setting.value),
        enabled: Boolean(setting.value),
        environment: 'production',
        conditions: {},
        rolloutPercentage: 100,
        createdAt: new Date(setting.createdAt),
        updatedAt: new Date(setting.updatedAt)
      }));
  },

  updateFeatureFlag: async (key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> => {
    const settingKey = `feature_${key}`;
    const response = await configApi.updateSetting(settingKey, updates.isEnabled);
    
    return {
      key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: response.description || '',
      isEnabled: Boolean(response.value),
      enabled: Boolean(response.value),
      environment: 'production',
      conditions: {},
      rolloutPercentage: 100,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt)
    };
  },

  // Theme management (using settings)
  getThemes: async (): Promise<ThemeConfig[]> => {
    // Mock implementation for now
    const defaultTheme: ThemeConfig = {
      id: 'default',
      name: 'Default',
      description: 'Default application theme',
      isDefault: true,
      variables: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981'
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      spacing: {},
      borderRadius: {},
      shadows: {}
    };

    return [defaultTheme];
  },

  createTheme: async (theme: Omit<ThemeConfig, 'id'>): Promise<ThemeConfig> => {
    // Mock implementation
    return {
      id: `theme_${Date.now()}`,
      ...theme
    };
  },

  updateTheme: async (_id: string, theme: Partial<ThemeConfig>): Promise<ThemeConfig> => {
    // Mock implementation
    return theme as ThemeConfig;
  },

  deleteTheme: async (_id: string): Promise<void> => {
    // Mock implementation
  },

  // User-specific settings
  getUserSettings: async (_userId?: string): Promise<Record<string, any>> => {
    const settings = await configApi.getSettings('user');
    
    const userSettings: Record<string, any> = {};
    settings.forEach((setting: any) => {
      userSettings[setting.key] = setting.value;
    });

    return userSettings;
  },

  updateUserSettings: async (settings: Record<string, any>, _userId?: string): Promise<Record<string, any>> => {
    const updatePromises = Object.entries(settings).map(([key, value]) =>
      configApi.updateSetting(key, value)
    );
    
    await Promise.all(updatePromises);
    return settings;
  },

  // Configuration validation
  validateConfig: async (_config: Partial<AppConfig>): Promise<{ valid: boolean; errors: string[] }> => {
    // Mock implementation
    return { valid: true, errors: [] };
  },

  // Export/Import configuration
  exportConfig: async (): Promise<Blob> => {
    const config = await configApi.getAppConfig();
    const configJson = JSON.stringify(config, null, 2);
    return new Blob([configJson], { type: 'application/json' });
  },

  importConfig: async (_configFile: File): Promise<{ imported: number; errors: string[] }> => {
    // Mock implementation
    return { imported: 0, errors: [] };
  },

  // System initialization
  initializeSystem: async (): Promise<{ initialized: string[]; errors: string[] }> => {
    // Mock implementation
    return { initialized: ['permissions', 'roles', 'settings'], errors: [] };
  },

  // Health check for configuration
  getConfigHealth: async (): Promise<{ status: string; checks: Record<string, boolean> }> => {
    try {
      await Promise.all([
        configApi.getPermissions(),
        configApi.getRoles(),
        configApi.getSettings()
      ]);
      
      return {
        status: 'healthy',
        checks: {
          permissions: true,
          roles: true,
          settings: true,
          database: true
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        checks: {
          permissions: false,
          roles: false,
          settings: false,
          database: false
        }
      };
    }
  }
};

// React Query keys for the configuration API
export const configQueries = {
  appConfig: ['config'],
  permissions: ['permissions'],
  roles: ['roles'],
  navigation: ['navigation'],
  dynamicSettings: (category?: string, scope?: string) => ['dynamic-settings', category, scope],
  featureFlags: ['feature-flags'],
  themes: ['themes'],
  userSettings: (userId?: string) => ['user-settings', userId],
};
