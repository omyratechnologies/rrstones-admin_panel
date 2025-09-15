import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Check,
  X,
  Info,
  Lock,
  Globe
} from 'lucide-react';
import type { Setting } from '../types/settings';

interface SettingCardProps {
  setting: Setting;
  value: any;
  hasChanges: boolean;
  onValueChange: (value: any) => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: (selected: boolean) => void;
  isSelected: boolean;
  isLoading: boolean;
}

const SettingCard: React.FC<SettingCardProps> = ({
  setting,
  value,
  hasChanges,
  onValueChange,
  onSave,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  isLoading
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Render different input types based on setting type
  const renderInput = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onValueChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={!setting.isEditable}
            />
            <span className="text-sm text-gray-700">
              {Boolean(value) ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'number':
        return (
          <div className="space-y-1">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onValueChange(Number(e.target.value))}
              min={setting.validation?.min}
              max={setting.validation?.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              disabled={!setting.isEditable}
            />
            {setting.validation && (setting.validation.min !== undefined || setting.validation.max !== undefined) && (
              <p className="text-xs text-gray-500">
                Range: {setting.validation.min ?? '∞'} - {setting.validation.max ?? '∞'}
                {setting.metadata?.unit && ` ${setting.metadata.unit}`}
              </p>
            )}
          </div>
        );

      case 'string':
        // Handle enum values
        if (setting.validation?.enum) {
          return (
            <select
              value={value || ''}
              onChange={(e) => onValueChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              disabled={!setting.isEditable}
            >
              <option value="">Select an option</option>
              {setting.validation.enum.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }

        // Handle password-like fields
        const isPasswordField = setting.key.toLowerCase().includes('password') || 
                                setting.key.toLowerCase().includes('secret') ||
                                setting.key.toLowerCase().includes('token');

        if (isPasswordField) {
          return (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={value || ''}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                disabled={!setting.isEditable}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          );
        }

        // Regular text input
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            disabled={!setting.isEditable}
          />
        );

      case 'object':
      case 'array':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onValueChange(parsed);
              } catch {
                // Keep as string if invalid JSON
                onValueChange(e.target.value);
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm disabled:bg-gray-50"
            disabled={!setting.isEditable}
            placeholder={setting.type === 'object' ? '{}' : '[]'}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            disabled={!setting.isEditable}
          />
        );
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200 hover:border-gray-300'
    } ${hasChanges ? 'border-l-4 border-l-orange-400' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {setting.key}
              </h3>
              
              {/* Visibility indicator */}
              {setting.isPublic ? (
                <span title="Public setting">
                  <Globe className="h-3 w-3 text-green-500" />
                </span>
              ) : (
                <span title="Private setting">
                  <Lock className="h-3 w-3 text-red-500" />
                </span>
              )}
              
              {/* Type badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {setting.type}
              </span>
              
              {/* Change indicator */}
              {hasChanges && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                  Modified
                </span>
              )}
            </div>
            
            {setting.description && (
              <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          {hasChanges && (
            <>
              <button
                onClick={onSave}
                disabled={isLoading}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="Save changes"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onValueChange(setting.value)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Discard changes"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Edit setting"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          
          {setting.isEditable && (
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete setting"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Input Field */}
      <div className="mb-3">
        {renderInput()}
      </div>

      {/* Metadata and Help Text */}
      {(setting.metadata?.helpText || setting.validation) && (
        <div className="border-t border-gray-100 pt-3">
          {setting.metadata?.helpText && (
            <div className="flex items-start space-x-2 text-xs text-gray-600 mb-2">
              <Info className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <p>{setting.metadata.helpText}</p>
            </div>
          )}
          
          {setting.validation && (
            <div className="text-xs text-gray-500">
              {setting.validation.required && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 mr-2">
                  Required
                </span>
              )}
              {setting.validation.enum && (
                <span className="text-gray-600">
                  Options: {setting.validation.enum.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer with timestamps */}
      <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
        <div className="flex justify-between">
          <span>Updated: {new Date(setting.updatedAt).toLocaleDateString()}</span>
          {setting.metadata?.order && (
            <span>Order: {setting.metadata.order}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingCard;
