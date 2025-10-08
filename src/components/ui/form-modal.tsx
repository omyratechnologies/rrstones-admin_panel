import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { ImageUpload } from './image-upload';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'url' | 'select' | 'multiselect' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  accept?: string; // for file inputs
  maxSize?: number; // for file inputs in MB
  rows?: number; // for textarea
  min?: number; // for number inputs
  max?: number; // for number inputs
  step?: number; // for number inputs
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  title: string;
  description?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  initialData = {},
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md'
}: FormModalProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Update form data when modal opens or initialData changes (only when modal is opened)
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setErrors({});
    }
  }, [isOpen]); // Only depend on isOpen, not initialData to avoid infinite loops

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required) {
        const value = formData[field.name];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.name] = `${field.label} is required`;
        }
      }

      // Type-specific validations
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }

      if (field.type === 'number' && formData[field.name] !== undefined) {
        const num = Number(formData[field.name]);
        if (isNaN(num)) {
          newErrors[field.name] = 'Please enter a valid number';
        } else {
          if (field.min !== undefined && num < field.min) {
            newErrors[field.name] = `Value must be at least ${field.min}`;
          }
          if (field.max !== undefined && num > field.max) {
            newErrors[field.name] = `Value must be at most ${field.max}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.name}`;
    const hasError = !!errors[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-error ml-1">*</span>}
        </Label>

        {field.type === 'textarea' ? (
          <Textarea
            id={fieldId}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className={hasError ? 'border-error focus:border-error focus:ring-error' : ''}
          />
        ) : field.type === 'select' ? (
          <select
            id={fieldId}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
              hasError ? 'border-error focus:border-error focus:ring-error' : ''
            }`}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'multiselect' ? (
          <div className="space-y-2">
            <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2">
              {field.options?.map(option => (
                <label key={option.value} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData[field.name]) ? formData[field.name].includes(option.value) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(formData[field.name]) ? formData[field.name] : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFieldChange(field.name, newValues);
                    }}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {Array.isArray(formData[field.name]) && formData[field.name].length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {Array.isArray(formData[field.name]) ? formData[field.name].join(', ') : formData[field.name]}
              </div>
            )}
          </div>
        ) : field.type === 'file' ? (
          <ImageUpload
            value={formData[field.name]}
            onChange={(file) => handleFieldChange(field.name, file)}
            acceptedTypes={field.accept ? field.accept.split(',') : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']}
            maxSize={field.maxSize || 5}
            error={hasError ? errors[field.name] : undefined}
          />
        ) : (
          <Input
            id={fieldId}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => {
              const value = field.type === 'number' ? 
                (e.target.value === '' ? '' : Number(e.target.value)) : 
                e.target.value;
              handleFieldChange(field.name, value);
            }}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={hasError ? 'border-error focus:border-error focus:ring-error' : ''}
          />
        )}

        {hasError && (
          <p className="text-sm text-error">{errors[field.name]}</p>
        )}
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size={size}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {fields.map(renderField)}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : submitText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
