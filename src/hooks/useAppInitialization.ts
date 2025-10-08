import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermissionStore } from '@/stores/permissionStore';
import { useConfigStore } from '@/stores/configStore';
import { configApi, configQueries } from '@/services/configApi';

interface AppInitializationState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export const useAppInitialization = () => {
  const [initState, setInitState] = useState<AppInitializationState>({
    isLoading: true,
    isInitialized: false,
    error: null,
    progress: 0,
    currentStep: 'Starting initialization...'
  });

  const { setPermissions, setRoles } = usePermissionStore();
  const { 
    setConfig, 
    setNavigation, 
    setSettings, 
    setFeatures, 
    setThemes, 
    applyTheme 
  } = useConfigStore();

  // Fetch app configuration
  const { 
    data: appConfig, 
    isLoading: configLoading, 
    error: configError 
  } = useQuery({
    queryKey: configQueries.appConfig,
    queryFn: configApi.getAppConfig,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch permissions
  const { 
    data: permissions, 
    isLoading: permissionsLoading 
  } = useQuery({
    queryKey: configQueries.permissions,
    queryFn: configApi.getPermissions,
    enabled: !!appConfig,
  });

  // Fetch roles
  const { 
    data: roles, 
    isLoading: rolesLoading 
  } = useQuery({
    queryKey: configQueries.roles,
    queryFn: configApi.getRoles,
    enabled: !!appConfig,
  });

  // Fetch navigation
  const { 
    data: navigation, 
    isLoading: navigationLoading 
  } = useQuery({
    queryKey: configQueries.navigation,
    queryFn: configApi.getNavigation,
    enabled: !!appConfig,
  });

  // Fetch feature flags
  const { 
    data: featureFlags, 
    isLoading: featuresLoading 
  } = useQuery({
    queryKey: configQueries.featureFlags,
    queryFn: configApi.getFeatureFlags,
    enabled: !!appConfig,
  });

  // Fetch themes
  const { 
    data: themes, 
    isLoading: themesLoading 
  } = useQuery({
    queryKey: configQueries.themes,
    queryFn: configApi.getThemes,
    enabled: !!appConfig,
  });

  // Fetch user settings
  const { 
    data: userSettings, 
    isLoading: userSettingsLoading 
  } = useQuery({
    queryKey: configQueries.userSettings(),
    queryFn: () => configApi.getUserSettings(),
    enabled: !!appConfig,
  });

  // Initialize app when all data is loaded
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Loading configuration...',
          progress: 10 
        }));

        if (configError) {
          throw new Error('Failed to load app configuration');
        }

        if (!appConfig) return;

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Setting up permissions...',
          progress: 30 
        }));

        // Set up permissions and roles
        if (permissions) {
          setPermissions(permissions);
        }

        if (roles) {
          setRoles(roles);
        }

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Configuring navigation...',
          progress: 50 
        }));

        // Set up navigation
        if (navigation) {
          setNavigation(navigation);
        }

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Loading features...',
          progress: 70 
        }));

        // Set up feature flags
        if (featureFlags) {
          setFeatures(featureFlags);
        }

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Applying theme...',
          progress: 85 
        }));

        // Set up themes and apply default
        if (themes) {
          setThemes(themes);
          
          // Apply default theme or user preference
          const defaultTheme = themes.find(t => t.isDefault) || themes[0];
          const userTheme = userSettings?.theme ? 
            themes.find(t => t.id === userSettings.theme) : 
            defaultTheme;
          
          if (userTheme) {
            applyTheme(userTheme.id);
          }
        }

        // Set up user settings
        if (userSettings) {
          setSettings(userSettings);
        }

        // Set main config
        setConfig(appConfig);

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Initialization complete',
          progress: 100,
          isLoading: false,
          isInitialized: true 
        }));

      } catch (error) {
        console.error('App initialization failed:', error);
        setInitState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          currentStep: 'Initialization failed'
        }));
      }
    };

    // Check if all required data is loaded
    const allDataLoaded = !configLoading && 
                         !permissionsLoading && 
                         !rolesLoading && 
                         !navigationLoading && 
                         !featuresLoading && 
                         !themesLoading && 
                         !userSettingsLoading;

    if (allDataLoaded && appConfig) {
      initializeApp();
    }
  }, [
    appConfig,
    permissions,
    roles,
    navigation,
    featureFlags,
    themes,
    userSettings,
    configLoading,
    permissionsLoading,
    rolesLoading,
    navigationLoading,
    featuresLoading,
    themesLoading,
    userSettingsLoading,
    configError,
    setPermissions,
    setRoles,
    setConfig,
    setNavigation,
    setSettings,
    setFeatures,
    setThemes,
    applyTheme
  ]);

  // Retry initialization
  const retryInitialization = () => {
    setInitState({
      isLoading: true,
      isInitialized: false,
      error: null,
      progress: 0,
      currentStep: 'Retrying initialization...'
    });
    
    // Refetch all queries
    window.location.reload();
  };

  return {
    ...initState,
    retryInitialization,
    hasError: !!initState.error,
    canRetry: !!initState.error && !initState.isLoading
  };
};

// Hook for checking if specific features are enabled
export const useFeatureFlag = (flagKey: string): boolean => {
  const { features } = useConfigStore();
  
  const feature = features.find(f => f.key === flagKey);
  return feature?.isEnabled ?? false;
};

// Hook for getting dynamic settings by category
export const useDynamicSettings = (category?: string, scope?: string) => {
  return useQuery({
    queryKey: configQueries.dynamicSettings(category, scope),
    queryFn: () => configApi.getDynamicSettings(category),
    enabled: !!category
  });
};

// Hook for getting user-specific configuration
export const useUserConfig = () => {
  const { settings } = useConfigStore();
  const { user } = usePermissionStore();
  
  return {
    settings,
    user,
    preferences: {
      theme: settings.theme || 'default',
      language: settings.language || 'en',
      timezone: settings.timezone || 'UTC',
      notifications: settings.notifications || {},
    }
  };
};

// Hook for checking if app is ready to render
export const useAppReady = () => {
  const { isInitialized, error } = useAppInitialization();
  const { config } = useConfigStore();
  const { permissions } = usePermissionStore();
  
  return {
    isReady: isInitialized && !!config && permissions.length > 0,
    hasError: !!error,
    isLoading: !isInitialized && !error
  };
};
