// Core types for dynamic architecture
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  scope?: string;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
  isSystemRole?: boolean;
  hierarchy?: number;
  level?: number; // For role hierarchy comparison
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles?: Role[]; // Support for multiple roles
  permissions: Permission[];
  preferences: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dynamic UI Configuration
export interface UIComponent {
  id: string;
  type: 'page' | 'section' | 'widget' | 'action' | 'menu';
  name: string;
  path?: string;
  icon?: string;
  requiredPermissions: string[];
  requiredRoles?: string[];
  settings?: Record<string, any>;
  children?: UIComponent[];
  isVisible: boolean;
  order: number;
}

// Dynamic Settings
export interface DynamicSetting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  scope: 'global' | 'role' | 'user';
  requiredPermissions?: string[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  ui: {
    label: string;
    description?: string;
    inputType: 'text' | 'number' | 'select' | 'toggle' | 'color' | 'textarea' | 'file';
    options?: { label: string; value: any }[];
    group?: string;
    order: number;
    conditional?: {
      dependsOn: string;
      condition: any;
    };
  };
}

// Navigation & Menu Structure
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  href?: string;
  icon: string;
  requiredPermissions: string[];
  requiredRoles?: string[];
  children?: NavigationItem[];
  isVisible: boolean;
  enabled?: boolean;
  order: number;
  badge?: {
    text: string;
    color: string;
  };
}

// Feature Flags
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  enabled?: boolean; // Alias for isEnabled
  environment?: string;
  conditions?: Record<string, any>;
  rolloutPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow & Business Logic
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'form' | 'approval' | 'automation' | 'notification';
  requiredPermissions: string[];
  configuration: Record<string, any>;
  nextSteps: string[];
  conditions?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggerEvents: string[];
  isActive: boolean;
}

// API Configuration
export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  requiredPermissions: string[];
  rateLimit?: {
    requests: number;
    window: number;
  };
  cache?: {
    duration: number;
    key?: string;
  };
}

// Theme & Appearance
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  variables: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

// App Configuration
export interface AppConfig {
  ui: UIComponent[];
  navigation: NavigationItem[];
  settings: DynamicSetting[];
  features: FeatureFlag[];
  workflows: Workflow[];
  api: APIEndpoint[];
  themes: ThemeConfig[];
  currentTheme: string;
  version: string;
  lastUpdated: string;
}

// Permission Context
export interface PermissionContext {
  user: User;
  resource?: string;
  action?: string;
  data?: any;
  environment?: 'development' | 'staging' | 'production';
}
