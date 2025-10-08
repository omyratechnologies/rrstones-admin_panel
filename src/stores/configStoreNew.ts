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
