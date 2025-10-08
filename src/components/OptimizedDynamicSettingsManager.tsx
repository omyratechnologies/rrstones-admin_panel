import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronDown, 
  ChevronRight, 
  Save, 
  AlertCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/stores/permissionStore';
import { useSettings } from '@/stores/configStore';
import { configApi, configQueries } from '@/services/configApi';
import { requestManager } from '@/utils/requestManager';
import type { DynamicSetting } from '@/types/dynamic';

// Add missing interfaces for better type safety
interface ValidationError {
  field: string;
  message: string;
}

interface OptimizedDynamicSettingsManagerProps {
  category?: string;
  scope?: 'global' | 'role' | 'user';
  className?: string;
}

export function OptimizedDynamicSettingsManager({ 
  category,
  scope = 'global',
  className = '' 
}: OptimizedDynamicSettingsManagerProps) {
  const { hasAnyPermission } = usePermissions();
  const { getByCategory, updateSetting, getSetting } = useSettings();
  const queryClient = useQueryClient();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  
  // Ref to track if component is mounted to prevent updates after unmount
  const isMountedRef = useRef(true);
  
  // Ref to store the latest debounced update function
  const debouncedUpdateRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear all pending debounced updates
      debouncedUpdateRef.current.forEach(timeout => clearTimeout(timeout));
      debouncedUpdateRef.current.clear();
    };
  }, []);

  // Optimized mutation for updating settings with deduplication
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return await configApi.updateSetting(key, value);
    },
    onSuccess: (_data, variables) => {
      if (!isMountedRef.current) return;
      
      // Update local store
      updateSetting(variables.key, variables.value);
      
      // Invalidate cache efficiently - only for settings-related queries
      queryClient.invalidateQueries({ 
        queryKey: configQueries.dynamicSettings(),
        exact: false 
      });
      
      // Apply setting globally using the request manager's throttled function
      requestManager.throttledGlobalRefresh(async () => {
        applySettingGlobally(variables.key, variables.value);
      });
      
      // Clear pending change
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(variables.key);
        return newMap;
      });
      
      toast.success('Setting updated successfully');
    },
    onError: (error: any) => {
      if (!isMountedRef.current) return;
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update setting';
      toast.error(`Failed to update setting: ${errorMessage}`);
    }
  });

  // Debounced setting update to prevent rapid API calls
  const debouncedUpdateSetting = useCallback((key: string, value: any) => {
    // Clear any existing timeout for this key
    const existingTimeout = debouncedUpdateRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        updateSettingMutation.mutate({ key, value });
      }
      debouncedUpdateRef.current.delete(key);
    }, 1000); // 1 second debounce

    debouncedUpdateRef.current.set(key, timeout);
  }, [updateSettingMutation]);

  // Function to apply theme changes globally with throttling
  const applyThemeChanges = useCallback((key: string, value: any) => {
    if (!isMountedRef.current) return;
    
    requestManager.throttledGlobalRefresh(async () => {
      const root = document.documentElement;
      
      // Handle different theme-related settings
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
          if (value) root.style.setProperty('--radius', `${value}px`);
          break;
        case 'theme.fontSize':
          if (value) root.style.setProperty('--font-size-base', `${value}px`);
          break;
        case 'layout.sidebarWidth':
          if (value) root.style.setProperty('--sidebar-width', `${value}px`);
          break;
        case 'layout.headerHeight':
          if (value) root.style.setProperty('--header-height', `${value}px`);
          break;
        default:
          // Apply other settings
          if (key.startsWith('theme.') && value) {
            const cssProperty = key.replace('theme.', '').replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(`--${cssProperty}`, value);
          }
      }
    });
  }, []);

  // Handle setting change with validation and debouncing
  const handleSettingChange = useCallback((setting: DynamicSetting, newValue: any) => {
    if (!isMountedRef.current) return;
    
    // Clear any existing validation error
    setValidationErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(setting.key);
      return newMap;
    });

    // Basic validation
    let isValid = true;
    let errorMessage = '';

    try {
      if (setting.validation) {
        if (setting.validation.required && (newValue === '' || newValue === null || newValue === undefined)) {
          isValid = false;
          errorMessage = 'This field is required';
        } else if (setting.type === 'number') {
          const numValue = Number(newValue);
          if (isNaN(numValue)) {
            isValid = false;
            errorMessage = 'Must be a valid number';
          } else if (setting.validation.min !== undefined && numValue < setting.validation.min) {
            isValid = false;
            errorMessage = `Must be at least ${setting.validation.min}`;
          } else if (setting.validation.max !== undefined && numValue > setting.validation.max) {
            isValid = false;
            errorMessage = `Must be at most ${setting.validation.max}`;
          }
        } else if (setting.type === 'string') {
          const stringValue = String(newValue);
          // Use min/max for string length validation since minLength/maxLength don't exist in the interface
          if (setting.validation.min && stringValue.length < setting.validation.min) {
            isValid = false;
            errorMessage = `Must be at least ${setting.validation.min} characters`;
          } else if (setting.validation.max && stringValue.length > setting.validation.max) {
            isValid = false;
            errorMessage = `Must be at most ${setting.validation.max} characters`;
          }
        }
        
        // Enum validation
        if (setting.validation.enum && !setting.validation.enum.includes(newValue)) {
          isValid = false;
          errorMessage = `Value must be one of: ${setting.validation.enum.join(', ')}`;
        }
        
        // Pattern validation
        if (setting.validation.pattern && setting.type === 'string') {
          const regex = new RegExp(setting.validation.pattern);
          if (!regex.test(String(newValue))) {
            isValid = false;
            errorMessage = 'Value does not match required pattern';
          }
        }
      }
    } catch (error) {
      console.warn('Validation error:', error);
      isValid = false;
      errorMessage = 'Validation failed';
    }

    if (!isValid) {
      setValidationErrors(prev => new Map(prev).set(setting.key, errorMessage));
      return;
    }

    // Update pending changes
    setPendingChanges(prev => new Map(prev).set(setting.key, newValue));

    // Apply theme changes immediately for better UX
    if (setting.key.startsWith('theme.')) {
      applyThemeChanges(setting.key, newValue);
    }

    // Debounce the API call
    debouncedUpdateSetting(setting.key, newValue);
  }, [debouncedUpdateSetting, applyThemeChanges]);

  // Optimized toggle function for group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Get current settings with caching
  const settings: DynamicSetting[] = getByCategory(category || 'general') as DynamicSetting[];

  // Filter settings based on permissions and scope
  const filteredSettings = settings.filter(setting => {
    if (!setting) return false;
    
    // Check permissions
    if (setting.requiredPermissions && setting.requiredPermissions.length > 0) {
      if (!hasAnyPermission(setting.requiredPermissions)) {
        return false;
      }
    }

    // Filter by scope
    if (setting.scope && setting.scope !== scope) {
      return false;
    }

    return true;
  });

  // Group settings by UI group
  const groupedSettings = filteredSettings.reduce((groups, setting) => {
    const group = setting.ui.group || 'General';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(setting);
    return groups;
  }, {} as Record<string, DynamicSetting[]>);

  // Handle batch save of all pending changes
  const handleBatchSave = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    const changes = Array.from(pendingChanges.entries());
    const errors: ValidationError[] = [];
    
    try {
      // Validate all changes before saving
      for (const [key, value] of changes) {
        const setting = settings.find(s => s.key === key);
        if (setting?.validation) {
          // Perform validation (reuse validation logic)
          if (setting.validation.required && (value === '' || value === null || value === undefined)) {
            errors.push({ field: key, message: 'This field is required' });
          }
        }
      }
      
      if (errors.length > 0) {
        toast.error(`Validation failed for ${errors.length} setting(s)`);
        return;
      }
      
      // Use batch processing for multiple updates
      const batchRequests = changes.map(([key, value]) => ({
        key: `batch-save-${key}`,
        fn: () => configApi.updateSetting(key, value),
        priority: 8
      }));

      const results = await requestManager.batchRequests(batchRequests, 2); // Process 2 at a time
      
      // Check for any failed requests
      const failedCount = results.filter(result => result === null).length;
      
      if (failedCount === 0) {
        setPendingChanges(new Map());
        toast.success(`${changes.length} settings saved successfully`);
      } else {
        toast.error(`${changes.length - failedCount} settings saved, ${failedCount} failed`);
      }
      
      // Invalidate cache after batch save
      queryClient.invalidateQueries({ 
        queryKey: configQueries.dynamicSettings(),
        exact: false 
      });
      
    } catch (error) {
      console.error('Batch save failed:', error);
      toast.error('Failed to save some settings');
    }
  }, [pendingChanges, queryClient, settings]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if settings are loaded
  useEffect(() => {
    if (settings && settings.length >= 0) {
      setIsLoading(false);
    }
  }, [settings]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  // Early return if no settings to display
  if (filteredSettings.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p className="mb-2">No settings available for this category.</p>
        {category && (
          <p className="text-sm">Try switching to a different category or check your permissions.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            {category ? `${category} Settings` : 'Settings'}
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
        </div>
        
        {pendingChanges.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-amber-600">
              {pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleBatchSave}
              disabled={updateSettingMutation.isPending}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <Save className="w-4 h-4" />
              <span>Save All</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings groups */}
      <div className="space-y-4">
        {Object.entries(groupedSettings).map(([groupName, groupSettings]) => (
          <div key={groupName} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
            >
              <span className="font-medium">{groupName}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {groupSettings.length} setting{groupSettings.length > 1 ? 's' : ''}
                </span>
                {expandedGroups.has(groupName) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>
            
            {expandedGroups.has(groupName) && (
              <div className="p-4 space-y-4">
                {groupSettings.map((setting) => (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={pendingChanges.get(setting.key) ?? getSetting(setting.key) ?? setting.value}
                    error={validationErrors.get(setting.key)}
                    onChange={(value) => handleSettingChange(setting, value)}
                    isPending={pendingChanges.has(setting.key)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Request status for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          Queue Status: {JSON.stringify(requestManager.getQueueStatus())}
        </div>
      )}
    </div>
  );
}

// Helper function to apply a single setting globally
function applySettingGlobally(key: string, value: any) {
  const root = document.documentElement;
  
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
        if (value) root.style.setProperty('--radius', `${value}px`);
        break;
      case 'layout.sidebarCollapsed':
        document.body.classList.toggle('sidebar-collapsed', Boolean(value));
        break;
      case 'ui.darkMode':
        document.body.classList.toggle('dark', Boolean(value));
        break;
      default:
        // Handle other settings
        if (key.startsWith('theme.') && value) {
          const cssProperty = key.replace('theme.', '').replace(/([A-Z])/g, '-$1').toLowerCase();
          root.style.setProperty(`--${cssProperty}`, value);
        }
    }
  } catch (error) {
    console.warn(`Failed to apply setting ${key}:`, error);
  }
}

// Optimized setting field component
interface SettingFieldProps {
  setting: DynamicSetting;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  isPending: boolean;
}

function SettingField({ setting, value, error, onChange, isPending }: SettingFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleInputChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  const renderInput = () => {
    const baseInputClass = `w-full px-3 py-2 border rounded-md transition-colors duration-200 ${
      error ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
    } focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
      error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
    }`;
    
    switch (setting.ui.inputType) {
      case 'toggle':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(localValue)}
              onChange={(e) => handleInputChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              disabled={isPending}
            />
            <span className="ml-2 text-sm text-gray-700">
              {Boolean(localValue) ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={localValue ?? ''}
            onChange={(e) => handleInputChange(e.target.value ? Number(e.target.value) : '')}
            min={setting.validation?.min}
            max={setting.validation?.max}
            step={setting.type === 'number' ? 'any' : undefined}
            className={baseInputClass}
            disabled={isPending}
            placeholder={`Enter a number${setting.validation?.min !== undefined ? ` (min: ${setting.validation.min})` : ''}${setting.validation?.max !== undefined ? ` (max: ${setting.validation.max})` : ''}`}
          />
        );
      
      case 'select':
        return (
          <select
            value={localValue ?? ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseInputClass}
            disabled={isPending}
          >
            <option value="">Select an option...</option>
            {setting.ui.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={localValue || '#000000'}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              disabled={isPending}
            />
            <input
              type="text"
              value={localValue || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`flex-1 ${baseInputClass}`}
              placeholder="#000000"
              pattern="^#[0-9A-Fa-f]{6}$"
              disabled={isPending}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            value={localValue ?? ''}
            onChange={(e) => handleInputChange(e.target.value)}
            rows={4}
            className={baseInputClass}
            disabled={isPending}
            placeholder={setting.ui.description || 'Enter text...'}
          />
        );
      
      case 'file':
        return (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleInputChange(file.name); // Store filename for now
              }
            }}
            className={`${baseInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            disabled={isPending}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={localValue ?? ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseInputClass}
            disabled={isPending}
            placeholder={setting.ui.description || 'Enter text...'}
            pattern={setting.validation?.pattern}
          />
        );
    }
  };

  return (
    <div className="flex items-start justify-between space-x-4">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <label className="font-medium text-sm">{setting.ui.label}</label>
          {isPending && (
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
              Saving...
            </span>
          )}
        </div>
        {setting.ui.description && (
          <p className="text-sm text-gray-600 mt-1">{setting.ui.description}</p>
        )}
        {error && (
          <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 w-48">
        {renderInput()}
      </div>
    </div>
  );
}