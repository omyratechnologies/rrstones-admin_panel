import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi, configQueries } from '@/services/configApi';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/store/authStore';
import { requestManager } from '@/utils/requestManager';

// Extend Window interface for global settings
declare global {
  interface Window {
    features?: Record<string, any>;
    businessSettings?: Record<string, any>;
  }
}

/**
 * Optimized hook to watch for settings changes and apply them globally
 * Reduces API calls and implements intelligent refresh strategies
 */
export const useOptimizedGlobalSettingsWatcher = () => {
  const { setSettings } = useConfigStore();
  const { isAuthenticated } = useAuthStore();
  const lastUpdateRef = useRef<number>(0);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Optimized settings query with longer intervals and smarter refresh logic
  const { data: settings, error, refetch } = useQuery({
    queryKey: configQueries.dynamicSettings(),
    queryFn: () => requestManager.queueRequest(
      'global-settings',
      configApi.getSettings,
      3 // Lower priority than critical app data
    ),
    refetchInterval: () => {
      // Dynamic refresh interval based on app state
      if (!document.hidden && isAuthenticated) {
        // Active tab and authenticated: check every 2 minutes
        return 120000;
      } else if (isAuthenticated) {
        // Background tab: check every 10 minutes
        return 600000;
      }
      // Not authenticated: don't refetch
      return false;
    },
    refetchOnWindowFocus: false, // Disable automatic focus refetch
    refetchOnMount: true,
    retry: 1,
    retryDelay: 2000,
    enabled: isAuthenticated,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Smart visibility change handler - only refetch if tab has been hidden for more than 5 minutes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab becomes hidden - schedule a potential refetch for when it becomes visible
        visibilityTimeoutRef.current = setTimeout(() => {
          // This will trigger a refetch when tab becomes visible after 5 minutes
          lastUpdateRef.current = Date.now();
        }, 300000); // 5 minutes
      } else {
        // Tab becomes visible
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        // Only refetch if we've been away for more than 5 minutes
        if (isAuthenticated && Date.now() - lastUpdateRef.current > 300000) {
          requestManager.throttledGlobalRefresh(() => refetch());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [isAuthenticated, refetch]);

  // Apply settings when they change
  useEffect(() => {
    if (error) {
      console.warn('Settings fetch error (this is normal if not authenticated):', error);
      return;
    }

    if (settings && Array.isArray(settings)) {
      try {
        // Update the settings store
        const settingsMap: Record<string, any> = {};
        settings.forEach((setting: any) => {
          if (setting && setting.key && setting.value !== undefined) {
            settingsMap[setting.key] = setting.value;
          }
        });
        setSettings(settingsMap);

        // Apply settings globally - but throttled to prevent excessive DOM updates
        requestManager.throttledGlobalRefresh(async () => {
          applySettingsGlobally(settingsMap);
        });

        lastUpdateRef.current = Date.now();
      } catch (error) {
        console.error('Error processing settings:', error);
      }
    }
  }, [settings, error, setSettings]);

  return {
    settings,
    isLoading: !settings && !error && isAuthenticated,
    error: error?.message,
    lastUpdate: lastUpdateRef.current,
    forceRefresh: () => {
      requestManager.clearCache('global-settings');
      refetch();
    }
  };
};

/**
 * Apply settings globally to the application
 * This function is throttled to prevent excessive DOM manipulation
 */
function applySettingsGlobally(settingsMap: Record<string, any>) {
  try {
    // Apply theme-related settings
    const root = document.documentElement;
    
    Object.entries(settingsMap).forEach(([key, value]) => {
      try {
        switch (key) {
          case 'theme.primaryColor':
            if (value) root.style.setProperty('--primary', value);
            break;
          case 'theme.secondaryColor':
            if (value) root.style.setProperty('--secondary', value);
            break;
          case 'theme.accentColor':
            if (value) root.style.setProperty('--accent', value);
            break;
          case 'theme.borderRadius':
            if (value) root.style.setProperty('--radius', value);
            break;
          case 'layout.sidebarCollapsed':
            document.body.classList.toggle('sidebar-collapsed', Boolean(value));
            break;
          case 'ui.darkMode':
            document.body.classList.toggle('dark', Boolean(value));
            break;
          case 'ui.animations':
            document.body.classList.toggle('reduce-motion', !Boolean(value));
            break;
          case 'features.enableBetaFeatures':
            window.features = { ...window.features, betaFeatures: Boolean(value) };
            break;
          default:
            // Handle business-specific settings
            if (key.startsWith('business.')) {
              const businessKey = key.replace('business.', '');
              window.businessSettings = { 
                ...window.businessSettings, 
                [businessKey]: value 
              };
            }
            break;
        }
      } catch (settingError) {
        console.warn(`Failed to apply setting ${key}:`, settingError);
      }
    });

    // Dispatch a custom event to notify other components of settings changes
    window.dispatchEvent(new CustomEvent('settingsUpdated', { 
      detail: { settings: settingsMap } 
    }));
  } catch (error) {
    console.error('Error applying settings globally:', error);
  }
}

export { applySettingsGlobally };