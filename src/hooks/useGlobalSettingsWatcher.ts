import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configApi, configQueries } from '@/services/configApi';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/store/authStore';

// Extend Window interface for global settings
declare global {
  interface Window {
    features?: Record<string, any>;
    businessSettings?: Record<string, any>;
  }
}

/**
 * Hook to watch for settings changes and apply them globally
 */
export const useGlobalSettingsWatcher = () => {
  const { setSettings } = useConfigStore();
  const { isAuthenticated } = useAuthStore();

  // Watch for settings changes - only when authenticated
  const { data: settings, error } = useQuery({
    queryKey: configQueries.dynamicSettings(),
    queryFn: () => configApi.getSettings(),
    refetchInterval: 30000, // Refetch every 30 seconds to catch changes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1, // Reduce retries for unauthenticated users
    retryDelay: 1000,
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });

  useEffect(() => {
    if (error) {
      console.warn('Settings fetch error (this is normal if not authenticated):', error);
      return;
    }

    if (settings && Array.isArray(settings)) {
      // Update the settings store
      const settingsMap: Record<string, any> = {};
      settings.forEach((setting: any) => {
        if (setting && setting.key && setting.value !== undefined) {
          settingsMap[setting.key] = setting.value;
        }
      });
      setSettings(settingsMap);

      // Apply settings globally
      applyGlobalSettings(settingsMap);
    } else if (settings && typeof settings === 'object') {
      // Handle case where settings is an object instead of array
      const settingsMap = settings as Record<string, any>;
      setSettings(settingsMap);
      applyGlobalSettings(settingsMap);
    }
  }, [settings, error, setSettings]);

  return { settings };
};

/**
 * Apply settings changes globally throughout the application
 */
const applyGlobalSettings = (settings: Record<string, any>) => {
  const root = document.documentElement;

  // Apply theme settings
  Object.entries(settings).forEach(([key, value]) => {
    applySettingGlobally(key, value, root);
  });
};

/**
 * Apply individual setting changes globally
 */
export const applySettingGlobally = (key: string, value: any, root: HTMLElement = document.documentElement) => {
  console.log('🎨 Applying setting globally:', { key, value });
  
  // Theme and appearance settings
  if (key.includes('theme') || key.includes('appearance')) {
    console.log('🎨 Applying theme setting:', { key, value });
    applyThemeSetting(key, value, root);
  }

  // UI and layout settings
  if (key.includes('ui') || key.includes('layout')) {
    applyUISetting(key, value, root);
  }

  // Typography settings
  if (key.includes('font') || key.includes('typography')) {
    applyTypographySetting(key, value, root);
  }

  // Color settings
  if (key.includes('color') || key.includes('primary') || key.includes('secondary')) {
    applyColorSetting(key, value, root);
  }

  // Feature flags
  if (key.startsWith('feature_')) {
    applyFeatureSetting(key, value);
  }

  // Application-level settings
  if (key.includes('app_') || key.includes('application_')) {
    applyApplicationSetting(key, value);
  }

  // Business settings
  if (key.startsWith('business.')) {
    applyBusinessSetting(key, value);
  }
};

/**
 * Apply theme-related settings with enhanced color system
 */
const applyThemeSetting = (key: string, value: any, root: HTMLElement) => {
  switch (key) {
    case 'appearance.theme':
    case 'theme_mode':
    case 'appearance_theme':
      if (value === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      break;

    case 'appearance.primary_color':
    case 'theme_primary_color':
    case 'primary_color':
      // Apply primary color with all variants
      const hslValue = hexToHsl(value);
      const rgbValue = hexToRgb(value);
      
      // Base primary color
      root.style.setProperty('--primary-hex', value);
      root.style.setProperty('--primary', hslValue);
      root.style.setProperty('--primary-rgb', rgbValue);
      root.style.setProperty('--ring', hslValue); // For focus rings
      
      // Generate and apply primary color variants
      const primaryVariants = generatePrimaryColorVariants(value);
      root.style.setProperty('--primary-hover', primaryVariants.hover);
      root.style.setProperty('--primary-light', primaryVariants.light);
      root.style.setProperty('--primary-lighter', primaryVariants.lighter);
      
      // Update granite variant color to match primary
      root.style.setProperty('--granite-variant', hslValue);
      
      // Update focus and selection colors
      root.style.setProperty('--focus-ring', hslValue);
      root.style.setProperty('--selection', primaryVariants.light);
      
      console.log('🎨 Applied primary color system:', { value, hslValue, variants: primaryVariants });
      break;

    case 'appearance.secondary_color':
    case 'theme_secondary_color':
    case 'secondary_color':
      const secondaryHsl = hexToHsl(value);
      root.style.setProperty('--secondary', secondaryHsl);
      root.style.setProperty('--secondary-rgb', hexToRgb(value));
      
      const secondaryVariants = generateSecondaryColorVariants(value);
      root.style.setProperty('--secondary-hover', secondaryVariants.hover);
      break;

    case 'theme_background':
    case 'background_color':
      root.style.setProperty('--background', value);
      break;

    case 'theme_surface':
    case 'surface_color':
      root.style.setProperty('--surface', value);
      break;

    case 'theme_text':
    case 'text_color':
      root.style.setProperty('--text', value);
      break;

    default:
      // Handle other theme variables dynamically
      if (key.startsWith('theme_') || key.startsWith('appearance.')) {
        const cssVar = key.replace(/^(theme_|appearance\.)/, '');
        root.style.setProperty(`--${cssVar}`, value);
      }
      break;
  }
};

/**
 * Apply UI and layout settings
 */
const applyUISetting = (key: string, value: any, root: HTMLElement) => {
  switch (key) {
    case 'ui_font_size':
    case 'font_size_base':
      root.style.setProperty('--font-size-base', `${value}px`);
      break;

    case 'ui_border_radius':
    case 'border_radius':
      root.style.setProperty('--border-radius', `${value}px`);
      break;

    case 'ui_spacing':
    case 'spacing_unit':
      root.style.setProperty('--spacing-unit', `${value}px`);
      break;

    case 'ui_sidebar_width':
    case 'sidebar_width':
      root.style.setProperty('--sidebar-width', `${value}px`);
      break;

    case 'ui_header_height':
    case 'header_height':
      root.style.setProperty('--header-height', `${value}px`);
      break;

    case 'ui_max_width':
    case 'max_width':
      root.style.setProperty('--max-width', `${value}px`);
      break;

    case 'ui_animation_duration':
    case 'animation_duration':
      root.style.setProperty('--animation-duration', `${value}ms`);
      break;

    default:
      // Handle other UI variables dynamically
      if (key.startsWith('ui_')) {
        const cssVar = key.replace('ui_', '');
        root.style.setProperty(`--${cssVar}`, value);
      }
      break;
  }
};

/**
 * Apply typography settings
 */
const applyTypographySetting = (key: string, value: any, root: HTMLElement) => {
  switch (key) {
    case 'font_family_heading':
    case 'typography_heading':
      root.style.setProperty('--font-family-heading', value);
      break;

    case 'font_family_body':
    case 'typography_body':
      root.style.setProperty('--font-family-body', value);
      break;

    case 'font_family_mono':
    case 'typography_mono':
      root.style.setProperty('--font-family-mono', value);
      break;

    case 'font_weight_normal':
      root.style.setProperty('--font-weight-normal', value);
      break;

    case 'font_weight_bold':
      root.style.setProperty('--font-weight-bold', value);
      break;

    case 'line_height':
      root.style.setProperty('--line-height', value);
      break;

    default:
      if (key.startsWith('font_') || key.startsWith('typography_')) {
        const cssVar = key.replace(/^(font_|typography_)/, 'font-');
        root.style.setProperty(`--${cssVar}`, value);
      }
      break;
  }
};

/**
 * Apply color settings
 */
const applyColorSetting = (key: string, value: any, root: HTMLElement) => {
  // Extract color name from key
  let colorName = key;
  if (key.includes('_color')) {
    colorName = key.replace('_color', '');
  }
  if (key.startsWith('theme_')) {
    colorName = key.replace('theme_', '');
  }

  // Apply the color
  root.style.setProperty(`--${colorName}`, value);
  root.style.setProperty(`--${colorName}-rgb`, hexToRgb(value));

  // Apply color variants if it's a primary color
  if (colorName.includes('primary')) {
    const variants = generateColorVariants(value);
    Object.entries(variants).forEach(([variant, color]) => {
      root.style.setProperty(`--primary-${variant}`, color);
    });
  }
};

/**
 * Apply feature flag settings
 */
const applyFeatureSetting = (key: string, value: boolean) => {
  const featureName = key.replace('feature_', '');
  const root = document.documentElement;
  
  // Add data attribute for CSS targeting
  root.setAttribute(`data-feature-${featureName}`, value.toString());
  
  // Add class for easy CSS targeting
  if (value) {
    root.classList.add(`feature-${featureName}`);
  } else {
    root.classList.remove(`feature-${featureName}`);
  }

  // Store in window for JavaScript access
  if (!window.features) {
    window.features = {};
  }
  window.features[featureName] = value;
};

/**
 * Apply business settings
 */
const applyBusinessSetting = (key: string, value: any) => {
  const root = document.documentElement;
  
  switch (key) {
    case 'business.company_name':
      // Set as CSS custom property for dynamic access
      root.style.setProperty('--company-name', `"${value}"`);
      
      // Update document title to include company name
      const currentTitle = document.title;
      if (currentTitle.includes('RRStones') || currentTitle.includes('Admin')) {
        document.title = `${value} - Admin Dashboard`;
      }
      
      // Store in window for JavaScript access
      if (!window.businessSettings) {
        window.businessSettings = {};
      }
      window.businessSettings.companyName = value;
      
      // Trigger a custom event for components to listen to
      const event = new CustomEvent('companyNameChanged', { 
        detail: { companyName: value } 
      });
      window.dispatchEvent(event);
      break;

    case 'business.currency':
      root.style.setProperty('--default-currency', `"${value}"`);
      if (!window.businessSettings) {
        window.businessSettings = {};
      }
      window.businessSettings.currency = value;
      break;

    case 'business.timezone':
      root.style.setProperty('--default-timezone', `"${value}"`);
      if (!window.businessSettings) {
        window.businessSettings = {};
      }
      window.businessSettings.timezone = value;
      break;

    default:
      // Handle other business settings dynamically
      if (key.startsWith('business.')) {
        const settingName = key.replace('business.', '');
        const cssVar = settingName.replace(/_/g, '-');
        root.style.setProperty(`--business-${cssVar}`, typeof value === 'string' ? `"${value}"` : value);
        
        if (!window.businessSettings) {
          window.businessSettings = {};
        }
        window.businessSettings[settingName] = value;
      }
      break;
  }
};

/**
 * Apply application-level settings
 */
const applyApplicationSetting = (key: string, value: any) => {
  switch (key) {
    case 'app_name':
    case 'application_name':
      document.title = value;
      break;

    case 'app_logo':
    case 'application_logo':
      // Update favicon or logo elements
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = value;
      }
      break;

    case 'app_maintenance_mode':
    case 'maintenance_mode':
      if (value) {
        document.body.classList.add('maintenance-mode');
      } else {
        document.body.classList.remove('maintenance-mode');
      }
      break;

    default:
      // Store in data attributes for other app settings
      if (key.startsWith('app_') || key.startsWith('application_')) {
        const dataKey = key.replace(/^(app_|application_)/, '');
        document.documentElement.setAttribute(`data-app-${dataKey}`, value);
      }
      break;
  }
};

/**
 * Helper function to convert hex to RGB
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '0, 0, 0';
};

/**
 * Generate primary color variants with proper HSL values
 */
const generatePrimaryColorVariants = (hex: string): Record<string, string> => {
  const hsl = hexToHsl(hex);
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  
  return {
    hover: `${h} ${s}% ${Math.max(l - 5, 0)}%`,
    light: `${h} ${s}% ${Math.min(l + 35, 95)}%`,
    lighter: `${h} ${s}% ${Math.min(l + 45, 98)}%`,
  };
};

/**
 * Generate secondary color variants with proper HSL values
 */
const generateSecondaryColorVariants = (hex: string): Record<string, string> => {
  const hsl = hexToHsl(hex);
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  
  return {
    hover: `${h} ${s}% ${Math.max(l - 5, 0)}%`,
  };
};

/**
 * Generate color variants (lighter/darker shades)
 */
const generateColorVariants = (hex: string): Record<string, string> => {
  // This is a simplified implementation
  // In a real app, you might use a color manipulation library
  return {
    '50': lightenColor(hex, 0.9),
    '100': lightenColor(hex, 0.8),
    '200': lightenColor(hex, 0.6),
    '300': lightenColor(hex, 0.4),
    '400': lightenColor(hex, 0.2),
    '500': hex,
    '600': darkenColor(hex, 0.1),
    '700': darkenColor(hex, 0.2),
    '800': darkenColor(hex, 0.3),
    '900': darkenColor(hex, 0.4),
  };
};

/**
 * Convert hex color to HSL values for Tailwind CSS
 */
const hexToHsl = (hex: string): string => {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${hDeg} ${sPercent}% ${lPercent}%`;
};

/**
 * Lighten a hex color
 */
const lightenColor = (hex: string, factor: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * factor * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

/**
 * Darken a hex color
 */
const darkenColor = (hex: string, factor: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * factor * 100);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
};
