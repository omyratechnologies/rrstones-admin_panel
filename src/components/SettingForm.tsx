import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Setting, SettingFormData } from '../types/settings';

interface SettingFormProps {
  setting?: Setting;
  onSubmit: (data: SettingFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SettingForm: React.FC<SettingFormProps> = ({
  setting,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    type: 'string',
    category: 'system',
    description: '',
    isPublic: true,
    isEditable: true,
    validation: {},
    metadata: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (setting) {
      setFormData({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description || '',
        isPublic: setting.isPublic,
        isEditable: setting.isEditable,
        validation: setting.validation || {},
        metadata: setting.metadata || {}
      });
    }
  }, [setting]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain letters, numbers, dots, hyphens, and underscores';
    }

    if (formData.value === '' || formData.value === null || formData.value === undefined) {
      newErrors.value = 'Value is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Type-specific validation
    if (formData.type === 'number') {
      const numValue = Number(formData.value);
      if (isNaN(numValue)) {
        newErrors.value = 'Value must be a valid number';
      } else {
        if (formData.validation?.min !== undefined && numValue < formData.validation.min) {
          newErrors.value = `Value must be at least ${formData.validation.min}`;
        }
        if (formData.validation?.max !== undefined && numValue > formData.validation.max) {
          newErrors.value = `Value must be at most ${formData.validation.max}`;
        }
      }
    }

    if (formData.type === 'boolean') {
      if (typeof formData.value !== 'boolean') {
        // Try to convert string to boolean
        if (formData.value === 'true') {
          setFormData(prev => ({ ...prev, value: true }));
        } else if (formData.value === 'false') {
          setFormData(prev => ({ ...prev, value: false }));
        } else {
          newErrors.value = 'Value must be true or false';
        }
      }
    }

    if ((formData.type === 'object' || formData.type === 'array') && typeof formData.value === 'string') {
      try {
        JSON.parse(formData.value);
      } catch {
        newErrors.value = 'Value must be valid JSON';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    let processedValue = formData.value;

    // Process value based on type
    if (formData.type === 'number') {
      processedValue = Number(formData.value);
    } else if (formData.type === 'boolean') {
      processedValue = Boolean(formData.value);
    } else if ((formData.type === 'object' || formData.type === 'array') && typeof formData.value === 'string') {
      try {
        processedValue = JSON.parse(formData.value);
      } catch {
        // Keep as string if parsing fails
      }
    }

    const submitData: SettingFormData = {
      ...formData,
      value: processedValue,
      validation: Object.keys(formData.validation || {}).length > 0 ? formData.validation : undefined,
      metadata: Object.keys(formData.metadata || {}).length > 0 ? formData.metadata : undefined
    };

    onSubmit(submitData);
  };

  const renderValueInput = () => {
    switch (formData.type) {
      case 'boolean':
        return (
          <select
            value={String(formData.value)}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value === 'true' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            step="any"
          />
        );

      case 'object':
      case 'array':
        return (
          <textarea
            value={typeof formData.value === 'string' ? formData.value : JSON.stringify(formData.value, null, 2)}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={formData.type === 'object' ? '{\n  "key": "value"\n}' : '[\n  "item1",\n  "item2"\n]'}
          />
        );

      default:
        return (
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {setting ? 'Edit Setting' : 'Create New Setting'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              disabled={!!setting} // Disable editing key for existing settings
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              placeholder="e.g., app.theme or business.tax_rate"
            />
            {errors.key && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.key}
              </p>
            )}
          </div>

          {/* Type and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., system, business, appearance"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            {renderValueInput()}
            {errors.value && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.value}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this setting controls..."
            />
          </div>

          {/* Validation Rules */}
          {formData.type === 'number' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Rules
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                  <input
                    type="number"
                    value={formData.validation?.min || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      validation: { ...prev.validation, min: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                  <input
                    type="number"
                    value={formData.validation?.max || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      validation: { ...prev.validation, max: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metadata
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Icon</label>
                <input
                  type="text"
                  value={formData.metadata?.icon || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, icon: e.target.value || undefined }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., settings, dollar-sign"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  value={formData.metadata?.order || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, order: e.target.value ? Number(e.target.value) : undefined }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Display order"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-600 mb-1">Help Text</label>
              <input
                type="text"
                value={formData.metadata?.helpText || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, helpText: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional help text for users"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Public Setting</span>
              <span className="text-xs text-gray-500">(visible to non-admin users)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isEditable}
                onChange={(e) => setFormData(prev => ({ ...prev, isEditable: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Editable</span>
              <span className="text-xs text-gray-500">(can be modified after creation)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {setting ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {setting ? 'Update Setting' : 'Create Setting'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingForm;
