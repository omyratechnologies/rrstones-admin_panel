import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermissionStore } from '@/stores/permissionStore';
import { useConfigStore } from '@/stores/configStore';
import { configApi, configQueries } from '@/services/configApi';
import { requestManager } from '@/utils/requestManager';

interface AppInitializationState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export const useOptimizedAppInitialization = () => {
  const [initState, setInitState] = useState<AppInitializationState>({
    isLoading: true,
    isInitialized: false,
    error: null,
    progress: 0,
    currentStep: 'Starting initialization...'
  });

  const { setPermissions, setRoles } = usePermissionStore();
  const { 
    setNavigation, 
    setSettings, 
    setFeatures, 
    setThemes, 
    applyTheme 
  } = useConfigStore();

  // Primary app configuration fetch (highest priority)
  const { 
    data: appConfig, 
    isLoading: configLoading, 
    error: configError 
  } = useQuery({
    queryKey: configQueries.appConfig,
    queryFn: () => requestManager.queueRequest(
      'app-config',
      configApi.getAppConfig,
      10 // Highest priority
    ),
    retry: 2,
    retryDelay: 1000,
    staleTime: 300000, // Consider data fresh for 5 minutes
    gcTime: 600000, // Keep in cache for 10 minutes (updated property name)
  });

  // Initialize app when primary config is loaded
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
          currentStep: 'Loading core data...',
          progress: 30 
        }));

        // Batch all secondary requests with lower priority and manage them efficiently
        const secondaryRequests = [
          {
            key: 'permissions',
            fn: configApi.getPermissions,
            priority: 8,
            handler: (data: any) => data && setPermissions(data)
          },
          {
            key: 'roles',
            fn: configApi.getRoles,
            priority: 8,
            handler: (data: any) => data && setRoles(data)
          },
          {
            key: 'navigation',
            fn: configApi.getNavigation,
            priority: 7,
            handler: (data: any) => data && setNavigation(data)
          },
          {
            key: 'feature-flags',
            fn: configApi.getFeatureFlags,
            priority: 6,
            handler: (data: any) => data && setFeatures(data)
          },
          {
            key: 'themes',
            fn: configApi.getThemes,
            priority: 5,
            handler: (data: any) => data && setThemes(data)
          },
          {
            key: 'user-settings',
            fn: () => configApi.getUserSettings(),
            priority: 4,
            handler: (data: any) => data && setSettings(data)
          }
        ];

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Processing data...',
          progress: 50 
        }));

        // Use batch processing with controlled concurrency
        const results = await requestManager.batchRequests(
          secondaryRequests.map(req => ({
            key: req.key,
            fn: req.fn,
            priority: req.priority
          })),
          3 // Process 3 requests at a time
        );

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Applying configuration...',
          progress: 80 
        }));

        // Apply results
        results.forEach((result, index) => {
          if (result) {
            try {
              secondaryRequests[index].handler(result);
            } catch (error) {
              console.warn(`Failed to apply ${secondaryRequests[index].key}:`, error);
            }
          }
        });

        setInitState(prev => ({ 
          ...prev, 
          currentStep: 'Finalizing...',
          progress: 95 
        }));

        // Apply default theme if available
        const themesResult = results[4]; // themes is the 5th request (index 4)
        if (themesResult && Array.isArray(themesResult) && themesResult.length > 0) {
          const defaultTheme = themesResult.find((theme: any) => theme.isDefault) || themesResult[0];
          if (defaultTheme) {
            applyTheme(defaultTheme.id);
          }
        }

        setInitState(prev => ({ 
          ...prev, 
          isLoading: false,
          isInitialized: true,
          currentStep: 'Initialization complete',
          progress: 100 
        }));

      } catch (error) {
        console.error('App initialization failed:', error);
        setInitState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof Error ? error.message : 'Initialization failed',
          progress: 0 
        }));
      }
    };

    if (appConfig && !configLoading && !configError) {
      initializeApp();
    }
  }, [appConfig, configLoading, configError, setPermissions, setRoles, setNavigation, setFeatures, setThemes, setSettings, applyTheme]);

  // Cleanup function to cancel pending requests on unmount
  useEffect(() => {
    return () => {
      requestManager.cancelRequests('app-init');
    };
  }, []);

  return {
    ...initState,
    queueStatus: requestManager.getQueueStatus()
  };
};