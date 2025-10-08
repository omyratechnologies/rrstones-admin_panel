import { useState } from 'react';
import { 
  Save, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '@/stores/permissionStore';
import { useSettings } from '@/stores/configStore';
import type { DynamicSetting } from '@/types/dynamic';

interface DynamicSettingsManagerProps {
  category?: string;
  scope?: 'global' | 'role' | 'user';
  className?: string;
}

export function DynamicSettingsManager({ 
  category,
  scope = 'global',
  className = '' 
}: DynamicSettingsManagerProps) {
  const { hasAnyPermission } = usePermissions();
  const { settings, updateSetting } = useSettings();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Get settings for the category
  const settings = category ? getByCategory(category) : [];

  // Filter settings based on permissions
  const visibleSettings = settings.filter(setting => {
    // Check permissions
    if (setting.requiredPermissions?.length) {
      if (!hasAnyPermission(setting.requiredPermissions)) {
        return false;
      }
    }

    // Check scope
    if (setting.scope !== scope) {
      return false;
    }

    // Check if it's advanced setting and advanced view is disabled
    if (setting.ui.group === 'advanced' && !showAdvanced) {
      return false;
    }

    return true;
  });

  // Group settings by their UI group
  const groupedSettings = visibleSettings.reduce((groups, setting) => {
    const group = setting.ui.group || 'general';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(setting);
    return groups;
  }, {} as Record<string, DynamicSetting[]>);

  const handleValueChange = (setting: DynamicSetting, value: any) => {
    // Validate the value
    const error = validateSettingValue(setting, value);
    const newErrors = new Map(validationErrors);
    
    if (error) {
      newErrors.set(setting.key, error);
    } else {
      newErrors.delete(setting.key);
    }
    
    setValidationErrors(newErrors);

    // Update pending changes
    const newPending = new Map(pendingChanges);
    newPending.set(setting.key, value);
    setPendingChanges(newPending);
  };

  const validateSettingValue = (setting: DynamicSetting, value: any): string | null => {
    const { validation } = setting;
    if (!validation) return null;

    if (validation.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    if (typeof value === 'string') {
      if (validation.min && value.length < validation.min) {
        return `Minimum length is ${validation.min}`;
      }
      if (validation.max && value.length > validation.max) {
        return `Maximum length is ${validation.max}`;
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return 'Invalid format';
      }
    }

    if (typeof value === 'number') {
      if (validation.min && value < validation.min) {
        return `Minimum value is ${validation.min}`;
      }
      if (validation.max && value > validation.max) {
        return `Maximum value is ${validation.max}`;
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      return `Value must be one of: ${validation.enum.join(', ')}`;
    }

    return null;
  };

  const handleSave = async () => {
    // Check for validation errors
    if (validationErrors.size > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      // Save all pending changes
      for (const [key, value] of pendingChanges) {
        updateSetting(key, value);
      }

      // Clear pending changes
      setPendingChanges(new Map());
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setPendingChanges(new Map());
    setValidationErrors(new Map());
    toast.info('Changes discarded');
  };

  const getValue = (setting: DynamicSetting) => {
    if (pendingChanges.has(setting.key)) {
      return pendingChanges.get(setting.key);
    }
    return getSetting(setting.key, setting.scope) ?? setting.value;
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const renderSettingInput = (setting: DynamicSetting) => {
    const value = getValue(setting);
    const error = validationErrors.get(setting.key);
    const hasChange = pendingChanges.has(setting.key);

    const baseInputClass = `block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-300' : 'border-gray-300'
    }`;

    switch (setting.ui.inputType) {
      case 'toggle':
        return (
          <div className="flex items-center">
            <button
              onClick={() => handleValueChange(setting, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {hasChange && (
              <span className="ml-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => handleValueChange(setting, e.target.value)}
              className={baseInputClass}
            >
              {setting.ui.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasChange && (
              <span className="absolute right-8 top-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => handleValueChange(setting, e.target.value)}
              rows={4}
              className={baseInputClass}
              placeholder={setting.ui.description}
            />
            {hasChange && (
              <span className="absolute right-2 top-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value}
              onChange={(e) => handleValueChange(setting, e.target.value)}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(setting, e.target.value)}
              className={`${baseInputClass} flex-1`}
              placeholder="#000000"
            />
            {hasChange && (
              <span className="text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(setting, Number(e.target.value))}
              className={baseInputClass}
              min={setting.validation?.min}
              max={setting.validation?.max}
            />
            {hasChange && (
              <span className="absolute right-2 top-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(setting, e.target.value)}
              className={baseInputClass}
              placeholder={setting.ui.description}
            />
            {hasChange && (
              <span className="absolute right-2 top-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
          </div>
        );
    }
  };

  const renderSettingGroup = (groupName: string, groupSettings: DynamicSetting[]) => {
    const isExpanded = expandedGroups.has(groupName);
    const sortedSettings = groupSettings.sort((a, b) => a.ui.order - b.ui.order);

    return (
      <div key={groupName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleGroup(groupName)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h3 className="text-sm font-medium text-gray-900 capitalize">
            {groupName.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            {sortedSettings.map(setting => {
              const error = validationErrors.get(setting.key);
              
              return (
                <div key={setting.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-900">
                      {setting.ui.label}
                    </label>
                    {setting.validation?.required && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                  </div>
                  
                  {setting.ui.description && (
                    <p className="text-sm text-gray-500">{setting.ui.description}</p>
                  )}
                  
                  {renderSettingInput(setting)}
                  
                  {error && (
                    <p className="text-sm text-red-600 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to manage settings.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Settings` : 'Settings'}
          </h2>
          <p className="text-sm text-gray-500">
            Configure your {scope} settings
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-4">
        {Object.entries(groupedSettings).map(([groupName, groupSettings]) =>
          renderSettingGroup(groupName, groupSettings)
        )}
      </div>

      {/* Save/Reset Bar */}
      {pendingChanges.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={validationErrors.size > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {Object.keys(groupedSettings).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Available</h3>
          <p className="text-gray-500">
            {category 
              ? `No ${category} settings are available for your role.`
              : 'No settings are available for your role.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
