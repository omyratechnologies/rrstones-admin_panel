/**
 * Design System Migration Utilities
 * Helper functions and mappings to replace hardcoded colors with semantic tokens
 */

// Color mapping from hardcoded Tailwind classes to semantic tokens
export const colorMigrationMap = {
  // Background colors
  'bg-blue-50': 'bg-primary-lighter',
  'bg-blue-100': 'bg-primary-light',
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary-hover',
  
  'bg-purple-50': 'bg-purple-50', // Keep for granite-specific colors
  'bg-purple-100': 'bg-purple-100',
  'bg-purple-500': 'bg-purple-500',
  'bg-purple-600': 'bg-purple-600',
  'bg-purple-700': 'bg-purple-700',
  
  'bg-green-50': 'bg-success-lighter',
  'bg-green-100': 'bg-success-light',
  'bg-green-500': 'bg-success',
  'bg-green-600': 'bg-success',
  'bg-green-700': 'bg-success/90',
  
  'bg-red-50': 'bg-error-lighter',
  'bg-red-100': 'bg-error-light',
  'bg-red-500': 'bg-error',
  'bg-red-600': 'bg-error',
  'bg-red-700': 'bg-error/90',
  
  'bg-yellow-50': 'bg-warning-lighter',
  'bg-yellow-100': 'bg-warning-light',
  'bg-yellow-500': 'bg-warning',
  'bg-yellow-600': 'bg-warning',
  'bg-yellow-700': 'bg-warning/90',
  
  'bg-orange-50': 'bg-warning-lighter',
  'bg-orange-100': 'bg-warning-light',
  'bg-orange-500': 'bg-warning',
  'bg-orange-600': 'bg-warning',
  'bg-orange-700': 'bg-warning/90',
  
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-border',
  'bg-gray-300': 'bg-border',
  'bg-gray-800': 'bg-muted-foreground',
  'bg-gray-900': 'bg-foreground',
  
  // Text colors
  'text-blue-600': 'text-primary',
  'text-blue-700': 'text-primary',
  'text-blue-800': 'text-primary',
  
  'text-purple-600': 'text-purple-600', // Keep for granite-specific
  'text-purple-700': 'text-purple-700',
  'text-purple-800': 'text-purple-800',
  
  'text-green-600': 'text-success',
  'text-green-700': 'text-success',
  'text-green-800': 'text-success',
  
  'text-red-600': 'text-error',
  'text-red-700': 'text-error',
  'text-red-800': 'text-error',
  
  'text-yellow-600': 'text-warning-foreground',
  'text-yellow-700': 'text-warning-foreground',
  'text-yellow-800': 'text-warning-foreground',
  
  'text-orange-600': 'text-warning-foreground',
  'text-orange-700': 'text-warning-foreground',
  'text-orange-800': 'text-warning-foreground',
  
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground/80',
  'text-gray-800': 'text-foreground/90',
  'text-gray-900': 'text-foreground',
  
  // Border colors
  'border-blue-100': 'border-primary-light',
  'border-blue-200': 'border-primary-light',
  'border-blue-300': 'border-primary',
  'border-blue-400': 'border-primary',
  'border-blue-500': 'border-primary',
  
  'border-purple-200': 'border-purple-200', // Keep for granite
  'border-purple-300': 'border-purple-300',
  'border-purple-400': 'border-purple-400',
  
  'border-green-200': 'border-success-light',
  'border-green-300': 'border-success',
  'border-green-400': 'border-success',
  
  'border-red-200': 'border-error-light',
  'border-red-300': 'border-error',
  'border-red-400': 'border-error',
  
  'border-yellow-200': 'border-warning-light',
  'border-yellow-300': 'border-warning',
  'border-yellow-400': 'border-warning',
  
  'border-orange-200': 'border-warning-light',
  'border-orange-300': 'border-warning',
  'border-orange-400': 'border-warning',
  
  'border-gray-100': 'border-border',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-input',
  
  // Hover states
  'hover:bg-blue-100': 'hover:bg-primary-lighter',
  'hover:bg-blue-700': 'hover:bg-primary-hover',
  'hover:bg-green-100': 'hover:bg-success-lighter',
  'hover:bg-green-600': 'hover:bg-success/90',
  'hover:bg-red-500': 'hover:bg-error/90',
  'hover:bg-red-600': 'hover:bg-error/90',
  'hover:bg-gray-50': 'hover:bg-muted/50',
  'hover:bg-gray-100': 'hover:bg-muted',
  'hover:bg-gray-900': 'hover:bg-muted-foreground',
  
  'hover:text-blue-500': 'hover:text-primary',
  'hover:text-blue-600': 'hover:text-primary',
  'hover:text-green-600': 'hover:text-success',
  'hover:text-purple-600': 'hover:text-purple-600', // Keep for granite
  'hover:text-gray-900': 'hover:text-foreground',
  
  'hover:border-blue-300': 'hover:border-primary-light',
  'hover:border-blue-400': 'hover:border-primary',
  'hover:border-green-400': 'hover:border-success',
  'hover:border-purple-400': 'hover:border-purple-400', // Keep for granite
  
  // Focus states
  'focus:ring-blue-500': 'focus:ring-primary/20',
  'focus:border-blue-500': 'focus:border-primary',
};

// Status color mappings for dynamic use
export const statusColorMap = {
  'pending': {
    bg: 'bg-warning-lighter',
    text: 'text-warning-foreground',
    border: 'border-warning-light',
  },
  'completed': {
    bg: 'bg-success-lighter',
    text: 'text-success-foreground',
    border: 'border-success-light',
  },
  'processing': {
    bg: 'bg-info-lighter',
    text: 'text-info-foreground',
    border: 'border-info-light',
  },
  'cancelled': {
    bg: 'bg-error-lighter',
    text: 'text-error-foreground',
    border: 'border-error-light',
  },
  'active': {
    bg: 'bg-success-lighter',
    text: 'text-success',
    border: 'border-success-light',
  },
  'inactive': {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

// Granite management specific color mappings
export const graniteColorMap = {
  'variant': {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    border: 'border-primary',
    hover: 'hover:bg-primary-hover',
  },
  'specific': {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
  },
  'product': {
    bg: 'bg-success-lighter',
    text: 'text-success',
    border: 'border-success-light',
    hover: 'hover:bg-success-light',
  },
  'value': {
    bg: 'bg-warning-lighter',
    text: 'text-warning-foreground',
    border: 'border-warning-light',
    hover: 'hover:bg-warning-light',
  },
};

/**
 * Function to get status-based classes
 */
export const getStatusClasses = (status: string) => {
  const statusKey = status.toLowerCase();
  return statusColorMap[statusKey as keyof typeof statusColorMap] || statusColorMap['inactive'];
};

/**
 * Function to get granite management classes
 */
export const getGraniteClasses = (type: 'variant' | 'specific' | 'product' | 'value') => {
  return graniteColorMap[type];
};

/**
 * Function to migrate hardcoded color class to semantic token
 */
export const migrateColorClass = (className: string): string => {
  return colorMigrationMap[className as keyof typeof colorMigrationMap] || className;
};

/**
 * Function to batch migrate color classes in a string
 */
export const migrateColorClasses = (classString: string): string => {
  return classString.split(' ').map(cls => migrateColorClass(cls)).join(' ');
};

/**
 * Dynamic color utilities for JavaScript use
 */
export const getSemanticColor = (color: string, variant: 'default' | 'light' | 'lighter' | 'foreground' = 'default') => {
  const suffix = variant === 'default' ? '' : `-${variant}`;
  return `hsl(var(--${color}${suffix}))`;
};

export const buildColorClass = (type: 'bg' | 'text' | 'border', color: string, variant?: string) => {
  const variantSuffix = variant ? `-${variant}` : '';
  return `${type}-${color}${variantSuffix}`;
};
