import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AppConfig, 
  NavigationItem, 
  FeatureFlag, 
  ThemeConfig 
} from '@/types/dynamic';

interface ConfigState {
  // Main configuration
  config: AppConfig | null;
  
  // Additional state
  navigation: NavigationItem[];
  settings: Record<string, any>;
  features: FeatureFlag[];
  themes: ThemeConfig[];
  activeTheme: string | null;
  
  // Actions
  setConfig: (config: AppConfig) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  
  setNavigation: (navigation: NavigationItem[]) => void;
  setSettings: (settings: Record<string, any>) => void;
  setFeatures: (features: FeatureFlag[]) => void;
  setThemes: (themes: ThemeConfig[]) => void;
  applyTheme: (themeId: string) => void;
  
  // Getters
  getNavigationItems: () => NavigationItem[];
  getEnabledFeatures: () => FeatureFlag[];
  getCurrentTheme: () => ThemeConfig | null;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      navigation: [],
      settings: {},
      features: [],
      themes: [],
      activeTheme: null,

      // Config actions
      setConfig: (config) => set({ config }),
      updateConfig: (updates) => set(state => ({
        config: state.config ? { ...state.config, ...updates } : null
      })),

      // State setters
      setNavigation: (navigation) => set({ navigation }),
      setSettings: (settings) => set({ settings }),
      setFeatures: (features) => set({ features }),
      setThemes: (themes) => set({ themes }),

      // Theme actions
      applyTheme: (themeId) => {
        const theme = get().themes.find(t => t.id === themeId);
        if (theme) {
          // Apply CSS variables to document root
          const root = document.documentElement;
          Object.entries(theme.variables).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
          });
          
          set({ activeTheme: themeId });
        }
      },

      // Getters
      getNavigationItems: () => {
        const state = get();
        return state.navigation.filter(item => item.enabled !== false);
      },

      getEnabledFeatures: () => {
        const state = get();
        return state.features.filter(feature => feature.isEnabled);
      },

      getCurrentTheme: () => {
        const state = get();
        return state.themes.find(t => t.id === state.activeTheme) || null;
      },
    }),
    {
      name: 'config-store',
      partialize: (state) => ({
        settings: state.settings,
        activeTheme: state.activeTheme,
      }),
    }
  )
);

// Specialized hooks for different aspects of configuration
export const useNavigationConfig = () => {
  const { navigation, setNavigation, getNavigationItems } = useConfigStore();
  
  return {
    navigation,
    items: navigation, // alias for compatibility
    setNavigation,
    getNavigationItems,
    enabledItems: getNavigationItems(),
  };
};

export const useNavigation = () => {
  return useNavigationConfig();
};

export const useSettingsConfig = () => {
  const { settings, setSettings } = useConfigStore();
  
  return {
    settings,
    setSettings,
    getSetting: (key: string, defaultValue?: any) => settings[key] ?? defaultValue,
  };
};

export const useSettings = () => {
  const { settings, setSettings } = useConfigStore();
  
  return {
    getByCategory: (_category: string) => {
      // Mock implementation - in real app this would filter by category
      return [];
    },
    updateSetting: (key: string, value: any) => {
      // Update the settings in store
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Apply the setting globally immediately
      import('@/hooks/useGlobalSettingsWatcher').then(({ applySettingGlobally }) => {
        applySettingGlobally(key, value);
      });
    },
    getSetting: (key: string, _scope?: string) => {
      return settings[key];
    }
  };
};

export const useFeaturesConfig = () => {
  const { features, setFeatures, getEnabledFeatures } = useConfigStore();
  
  return {
    features,
    setFeatures,
    getEnabledFeatures,
    enabledFeatures: getEnabledFeatures(),
    isFeatureEnabled: (key: string) => features.find(f => f.key === key)?.isEnabled ?? false,
  };
};

export const useFeatures = () => {
  const { features } = useConfigStore();
  
  return {
    isEnabled: (key: string) => features.find(f => f.key === key)?.isEnabled ?? false,
  };
};

export const useThemeConfig = () => {
  const { themes, setThemes, applyTheme, getCurrentTheme, activeTheme } = useConfigStore();
  
  return {
    themes,
    setThemes,
    applyTheme,
    getCurrentTheme,
    activeTheme,
    currentTheme: getCurrentTheme(),
  };
};

export const useTheme = () => {
  const { getCurrentTheme } = useConfigStore();
  
  return {
    current: getCurrentTheme(),
  };
};
