import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { ImageUpload } from './image-upload';
import { Badge } from './badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  X, 
  Info,
  AlertCircle,
  CheckCircle,
  Package,
  DollarSign,
  Ruler,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import './modal.css';

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
  accept?: string;
  maxSize?: number;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  group?: string; // For organizing fields into groups
  description?: string; // Helper text
  icon?: React.ComponentType<{ className?: string }>; // Optional icon
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FormField[];
}

interface EnhancedFormModalProps {
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
  enableSections?: boolean; // Whether to organize fields into sections
}

export function EnhancedFormModal({
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
  size = 'xl', // Default to larger size for better UX
  enableSections = true
}: EnhancedFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  // Organize fields into logical sections
  const sections: FormSection[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Essential product details',
      icon: Package,
      fields: fields.filter(f => ['name', 'category', 'subcategory', 'status'].includes(f.name))
    },
    {
      id: 'dimensions',
      title: 'Dimensions & Specifications',
      description: 'Physical measurements and properties',
      icon: Ruler,
      fields: fields.filter(f => ['length', 'width', 'thickness', 'weight_per_piece', 'area_per_piece'].includes(f.name))
    },
    {
      id: 'packaging',
      title: 'Packaging & Inventory',
      description: 'Stock and packaging information',
      icon: Package,
      fields: fields.filter(f => ['pieces_per_crate', 'pieces_per_set', 'crate_weight', 'stock', 'unit_type'].includes(f.name))
    },
    {
      id: 'pricing',
      title: 'Pricing & Currency',
      description: 'Cost and pricing structure',
      icon: DollarSign,
      fields: fields.filter(f => ['price_per_unit', 'price_per_sqft', 'price_per_piece', 'price_per_set', 'currency', 'basePrice', 'unit'].includes(f.name))
    },
    {
      id: 'features',
      title: 'Features & Applications',
      description: 'Product characteristics and usage',
      icon: Tag,
      fields: fields.filter(f => ['finish', 'applications', 'special_features'].includes(f.name))
    },
    {
      id: 'media',
      title: 'Images & Media',
      description: 'Product photos and visual assets',
      icon: ImageIcon,
      fields: fields.filter(f => f.type === 'file' || f.name.includes('image'))
    }
  ].filter(section => section.fields.length > 0);

  // Use sections if enabled and available, otherwise use all fields
  const useSections = enableSections && sections.length > 1;
  const totalSteps = useSections ? sections.length : 1;

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setErrors({});
      setCurrentStep(0);
      updateCompletedFields(initialData || {});
    }
  }, [isOpen, initialData]);

  const updateCompletedFields = (data: Record<string, any>) => {
    const completed = new Set<string>();
    fields.forEach(field => {
      const value = data[field.name];
      if (value !== undefined && value !== '' && value !== null) {
        completed.add(field.name);
      }
    });
    setCompletedFields(completed);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
    setFormData(newFormData);
    updateCompletedFields(newFormData);

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

      if (field.type === 'number' && formData[field.name] !== undefined && formData[field.name] !== '') {
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

  const validateCurrentSection = (): boolean => {
    const currentFields = useSections ? sections[currentStep]?.fields || [] : fields;
    const newErrors: Record<string, string> = {};

    currentFields.forEach(field => {
      if (field.required) {
        const value = formData[field.name];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentSection() && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
    const isCompleted = completedFields.has(field.name);

    return (
      <div key={field.name} className="space-y-3 relative">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldId} className="text-sm font-medium text-foreground flex items-center gap-2">
            {field.icon && <field.icon className="h-4 w-4" />}
            {field.label}
            {field.required && <span className="text-error">*</span>}
            {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
          </Label>
          {field.description && (
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute right-0 top-6 w-72 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                <div className="absolute -top-1 right-4 w-2 h-2 bg-popover transform rotate-45"></div>
                {field.description}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          {field.type === 'textarea' ? (
            <Textarea
              id={fieldId}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={`w-full transition-all duration-200 ${
                hasError 
                  ? 'border-error focus:border-error focus:ring-error' 
                  : isCompleted 
                  ? 'border-success focus:border-success focus:ring-success'
                  : 'focus:border-primary focus:ring-primary'
              }`}
            />
          ) : field.type === 'select' ? (
            <select
              id={fieldId}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-200 bg-card ${
                hasError 
                  ? 'border-error focus:border-error focus:ring-error' 
                  : isCompleted 
                  ? 'border-success focus:border-success focus:ring-success'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'multiselect' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-md bg-muted">
                {Array.isArray(formData[field.name]) && formData[field.name].length > 0 ? (
                  formData[field.name].map((value: string) => (
                    <Badge key={value} variant="secondary" className="flex items-center gap-1">
                      {field.options?.find(opt => opt.value === value)?.label || value}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => {
                          const newValues = formData[field.name].filter((v: string) => v !== value);
                          handleFieldChange(field.name, newValues);
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No {field.label.toLowerCase()} selected</span>
                )}
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const currentValues = Array.isArray(formData[field.name]) ? formData[field.name] : [];
                    if (!currentValues.includes(e.target.value)) {
                      handleFieldChange(field.name, [...currentValues, e.target.value]);
                    }
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-card"
              >
                <option value="">Add {field.label}</option>
                {field.options?.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={Array.isArray(formData[field.name]) && formData[field.name].includes(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : field.type === 'file' ? (
            <div className="space-y-3">
              <ImageUpload
                value={formData[field.name]}
                onChange={(file) => handleFieldChange(field.name, file)}
                acceptedTypes={field.accept?.split(',').map(type => type.trim())}
                maxSize={field.maxSize}
                className={hasError ? 'border-error' : isCompleted ? 'border-success' : ''}
              />
              {field.accept && (
                <p className="text-xs text-muted-foreground">
                  Accepted formats: {field.accept.split(',').join(', ')}
                </p>
              )}
            </div>
          ) : (
            <Input
              id={fieldId}
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className={`w-full transition-all duration-200 ${
                hasError 
                  ? 'border-error focus:border-error focus:ring-error' 
                  : isCompleted 
                  ? 'border-success focus:border-success focus:ring-success'
                  : 'focus:border-primary focus:ring-primary'
              }`}
            />
          )}
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-error text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            {errors[field.name]}
          </div>
        )}
      </div>
    );
  };

  const currentSection = useSections ? sections[currentStep] : null;
  const currentFields = useSections ? (currentSection?.fields || []) : fields;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} className="mx-4 my-8">
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
        <ModalHeader className="border-b border-border pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <ModalTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                {currentSection?.icon && <currentSection.icon className="h-5 w-5" />}
                {title}
              </ModalTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>

          {useSections && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}: {currentSection?.title}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              {/* Section Navigation */}
              <div className="flex items-center space-x-1 overflow-x-auto">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      index === currentStep
                        ? 'bg-primary-lighter text-primary-dark'
                        : index < currentStep
                        ? 'bg-success-lighter text-success-dark'
                        : 'bg-muted text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <section.icon className="h-3 w-3" />
                    {section.title}
                    {index < currentStep && <CheckCircle className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ModalHeader>

        <ModalBody className="flex-1 overflow-y-auto modal-body-scroll px-3 sm:px-5">
          <div className="modal-content-container px-4 sm:px-6 py-4 space-y-6">
            {useSections ? (
              <div className="space-y-6">
                {currentSection && (
                  <>
                    <div className="text-center mb-6">
                      <currentSection.icon className="h-12 w-12 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-foreground">{currentSection.title}</h3>
                      {currentSection.description && (
                        <p className="text-sm text-muted-foreground mt-1">{currentSection.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {currentFields.map(renderField)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map(renderField)}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-border pt-4 pb-4 sm:pb-6 px-4 sm:px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              {useSections && currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>

              {useSections && currentStep < totalSteps - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {submitText}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
