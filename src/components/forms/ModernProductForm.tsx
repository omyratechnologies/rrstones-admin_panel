import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Plus, 
  Package, 
  DollarSign, 
  Ruler, 
  Image as ImageIcon, 
  Tag, 
  Calculator,
  X,
  Save,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Trash2,
  Sparkles,
  Home,
  Camera
} from 'lucide-react';
import { uploadPublicImage } from '../../services/uploadService';
import type { GraniteProduct, SpecificGraniteVariant } from '../../types';

interface ModernProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  specificVariant?: SpecificGraniteVariant;
  initialData?: Partial<GraniteProduct>;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'Pattern', 'Fillers', 'Platforms', 'Slab', 'Steps', 'Treads', 
  'Pool Coping', 'Pillar Caps', 'Firepit Coping', 'Horse Trough', 
  'BH Pavers', 'Curbs', 'Posts', 'Other'
];

const FINISHES = [
  { value: 'polished', label: 'Polished' },
  { value: 'honed', label: 'Honed' },
  { value: 'brushed', label: 'Brushed' },
  { value: 'bush_hammered', label: 'Bush Hammered' },
  { value: 'natural_split', label: 'Natural Split' },
  { value: 'flamed', label: 'Flamed' },
  { value: 'tumbled', label: 'Tumbled' },
  { value: 'sandblasted', label: 'Sandblasted' }
];

const APPLICATIONS = [
  { value: 'flooring', label: 'Flooring' },
  { value: 'wall_cladding', label: 'Wall Cladding' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'outdoor_platforms', label: 'Outdoor Platforms' },
  { value: 'patios', label: 'Patios' },
  { value: 'staircases', label: 'Staircases' },
  { value: 'pool_edges', label: 'Pool Edges' }
];

export default function ModernProductForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  specificVariant,
  initialData,
  mode 
}: ModernProductFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    // Basic Info
    name: '',
    category: '',
    subcategory: '',
    status: 'active',
    
    // Dimensions & Size Variants
    has_multiple_sizes: false,
    size_variants: [],
    dimensions: { length: '', width: '', thickness: '', unit: 'inches' },
    area_per_piece: '',
    weight_per_piece: '',
    
    // Business Config
    business_config: {
      pieces_per_crate: 10,
      filler_rate: 0.5,
      max_shipping_weight: 48000,
      weight_unit: 'lbs'
    },
    
    // Packaging & Inventory
    packaging: {
      pieces_per_crate: 10,
      pieces_per_set: '',
      crate_weight: '',
      pieces_weight: ''
    },
    stock: 0,
    unit_type: 'sqft',
    
    // Pricing
    pricing: {
      price_per_unit: '',
      price_per_sqft: '',
      price_per_piece: '',
      price_per_set: '',
      currency: 'USD'
    },
    basePrice: '',
    
    // Features
    finish: [],
    applications: [],
    special_features: [],
    
    // Media
    images: [],
    imageFiles: []
  });

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Product name, category, and basic details',
      icon: Tag,
      color: 'bg-blue-500'
    },
    {
      id: 'dimensions',
      title: 'Dimensions & Variants',
      description: 'Size specifications and variant options',
      icon: Ruler,
      color: 'bg-green-500'
    },
    {
      id: 'business',
      title: 'Business Logic',
      description: 'Pricing, inventory, and business rules',
      icon: Calculator,
      color: 'bg-purple-500'
    },
    {
      id: 'features',
      title: 'Features & Media',
      description: 'Finishes, applications, and images',
      icon: ImageIcon,
      color: 'bg-orange-500'
    }
  ];

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      const merged = {
        ...formData,
        ...initialData,
        variantSpecificId: specificVariant?._id || initialData.variantSpecificId,
      };
      
      // Ensure nested objects are properly merged
      if (initialData.dimensions) {
        merged.dimensions = { ...formData.dimensions, ...initialData.dimensions };
      }
      if (initialData.business_config) {
        merged.business_config = { ...formData.business_config, ...initialData.business_config };
      }
      if (initialData.packaging) {
        merged.packaging = { ...formData.packaging, ...initialData.packaging };
      }
      if (initialData.pricing) {
        merged.pricing = { ...formData.pricing, ...initialData.pricing };
      }
      
      // Ensure size variants are properly initialized with their stock values
      if (initialData.size_variants && Array.isArray(initialData.size_variants)) {
        merged.size_variants = initialData.size_variants.map((variant: any) => ({
          ...variant,
          stock: variant.stock || 0,
          price_per_piece: variant.price_per_piece || 0,
          area_per_piece: variant.area_per_piece || 0,
          weight_per_piece: variant.weight_per_piece || 0,
          sku: variant.sku || '',
          size_name: variant.size_name || '',
          dimensions: {
            length: variant.dimensions?.length || 0,
            width: variant.dimensions?.width || 0,
            thickness: variant.dimensions?.thickness || 0,
            unit: variant.dimensions?.unit || 'inches'
          }
        }));
      }
      
      setFormData(merged);
    } else if (specificVariant) {
      setFormData((prev: any) => ({
        ...prev,
        variantSpecificId: specificVariant._id
      }));
    }
  }, [initialData, specificVariant]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addSizeVariant = () => {
    const newVariant = {
      size_name: '',
      dimensions: { length: '', width: '', thickness: '', unit: 'inches' },
      area_per_piece: '',
      weight_per_piece: '',
      price_per_piece: '',
      price_per_sqft: '',
      stock: 0,
      sku: ''
    };
    
    setFormData((prev: any) => ({
      ...prev,
      size_variants: [...(prev.size_variants || []), newVariant]
    }));
  };

  const removeSizeVariant = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      size_variants: prev.size_variants.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateSizeVariant = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const variants = [...(prev.size_variants || [])];
      const keys = field.split('.');
      let current = variants[index];
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Auto-calculate area if dimensions change
      if (field.includes('dimensions') && variants[index].dimensions) {
        const { length, width } = variants[index].dimensions;
        if (length && width && !isNaN(parseFloat(length)) && !isNaN(parseFloat(width))) {
          variants[index].area_per_piece = ((parseFloat(length) * parseFloat(width)) / 144).toFixed(2);
        }
      }
      
      return { ...prev, size_variants: variants };
    });
  };

  const handleImageUpload = async (files: FileList) => {
    const newImages = [...formData.images];
    const newImageFiles = [...formData.imageFiles];
    
    for (let i = 0; i < files.length && newImages.length < 4; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImageFiles.push(file);
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newImages.push(previewUrl);
      }
    }
    
    setFormData((prev: any) => ({
      ...prev,
      images: newImages,
      imageFiles: newImageFiles
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
      imageFiles: prev.imageFiles.filter((_: any, i: number) => i !== index)
    }));
  };

  const validateStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Basic Info
        return formData.name && formData.category;
      case 1: // Dimensions
        if (formData.has_multiple_sizes) {
          return formData.size_variants?.length > 0 && formData.size_variants.every((v: any) => 
            v.size_name && v.dimensions?.length && v.dimensions?.width && v.dimensions?.thickness
          );
        }
        return formData.dimensions?.length && formData.dimensions?.width && formData.dimensions?.thickness;
      case 2: // Business
        return (formData.pricing?.price_per_unit || formData.basePrice) && formData.stock !== '';
      case 3: // Features
        return true; // Optional step
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload images first if any
      const uploadedImages = [];
      if (formData.imageFiles?.length > 0) {
        for (const file of formData.imageFiles) {
          try {
            const response = await uploadPublicImage(file);
            if (response.success && response.data?.url) {
              uploadedImages.push(response.data.url);
            }
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        }
      }

      // Prepare the clean data to submit
      const submitData: any = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory,
        status: formData.status || 'active',
        has_multiple_sizes: formData.has_multiple_sizes || (initialData?.has_multiple_sizes && mode === 'edit'),
        stock: parseInt(formData.stock) || 0,
        unit_type: formData.unit_type,
        finish: formData.finish || [],
        applications: formData.applications || [],
        special_features: formData.special_features || []
      };

      // Handle images
      if (uploadedImages.length > 0) {
        if (mode === 'edit' && formData.images) {
          submitData.images = [...formData.images, ...uploadedImages];
        } else {
          submitData.images = uploadedImages;
        }
      } else if (mode === 'create') {
        submitData.images = [];
      }

      // Handle pricing
      if (formData.pricing?.price_per_unit || formData.basePrice) {
        const price = parseFloat(formData.pricing?.price_per_unit || formData.basePrice) || 0;
        submitData.pricing = {
          price_per_unit: price,
          currency: formData.pricing?.currency || 'USD'
        };
        submitData.basePrice = price;
      }

      // Handle business config
      if (formData.business_config) {
        submitData.business_config = {
          pieces_per_crate: parseInt(formData.business_config.pieces_per_crate) || 10,
          filler_rate: parseFloat(formData.business_config.filler_rate) || 0.5,
          max_shipping_weight: parseInt(formData.business_config.max_shipping_weight) || 48000,
          weight_unit: formData.business_config.weight_unit || 'lbs'
        };
      }

      // Handle packaging
      if (formData.packaging) {
        submitData.packaging = {
          pieces_per_crate: parseInt(formData.packaging.pieces_per_crate) || 10,
          pieces_per_set: formData.packaging.pieces_per_set || '',
          crate_weight: formData.packaging.crate_weight || '',
          pieces_weight: formData.packaging.pieces_weight || ''
        };
      }

      // Handle dimensions and size variants
      const isMultiSize = formData.has_multiple_sizes || (initialData?.has_multiple_sizes && mode === 'edit');
      const variants = formData.size_variants && formData.size_variants.length > 0 
        ? formData.size_variants 
        : (initialData?.size_variants || []);
      
      if (isMultiSize && variants.length > 0) {
        // For multi-size products, always include size variants to ensure stock updates work
        submitData.size_variants = variants.map((variant: any) => ({
          _id: variant._id, // Preserve existing ID for updates
          size_name: variant.size_name,
          stock: parseInt(variant.stock) || 0,
          price_per_piece: parseFloat(variant.price_per_piece) || 0,
          price_per_sqft: parseFloat(variant.price_per_sqft) || 0,
          area_per_piece: parseFloat(variant.area_per_piece) || 0,
          weight_per_piece: parseFloat(variant.weight_per_piece) || 0,
          sku: variant.sku || '',
          dimensions: {
            length: parseFloat(variant.dimensions?.length) || 0,
            width: parseFloat(variant.dimensions?.width) || 0,
            thickness: parseFloat(variant.dimensions?.thickness) || 0,
            unit: variant.dimensions?.unit || 'inches'
          }
        }));
        
        // Ensure has_multiple_sizes is properly set
        submitData.has_multiple_sizes = true;
        
        // Don't include single product dimensions when we have size variants
        delete submitData.dimensions;
      } else if (formData.dimensions) {
        // Single size product
        submitData.dimensions = {
          length: parseFloat(formData.dimensions.length) || 0,
          width: parseFloat(formData.dimensions.width) || 0,
          thickness: parseFloat(formData.dimensions.thickness) || 0,
          unit: formData.dimensions.unit || 'inches'
        };
        if (formData.area_per_piece) {
          submitData.area_per_piece = parseFloat(formData.area_per_piece);
        }
        if (formData.weight_per_piece) {
          submitData.weight_per_piece = parseFloat(formData.weight_per_piece);
        }
      }

      // Include variant ID if present
      if (specificVariant?._id) {
        submitData.variantSpecificId = specificVariant._id;
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderDimensionsStep();
      case 2:
        return renderBusinessStep();
      case 3:
        return renderFeaturesStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-semibold text-gray-700">Product Name *</Label>
          <Input
            id="name"
            name="name"
            autoComplete="off"
            placeholder="e.g., Blue Mist Pattern 12x12"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
          />
          <p className="text-sm text-gray-500">Enter a unique name for this granite product</p>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="category" className="text-base font-semibold text-gray-700">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
            <SelectTrigger id="category" name="category" className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">Choose the primary category</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label htmlFor="subcategory" className="text-base font-semibold text-gray-700">Subcategory</Label>
          <Input
            id="subcategory"
            name="subcategory"
            autoComplete="off"
            placeholder="e.g., Natural Split, Polished"
            value={formData.subcategory}
            onChange={(e) => updateFormData('subcategory', e.target.value)}
            className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
          />
          <p className="text-sm text-gray-500">Optional: Specify finish or style details</p>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="status" className="text-base font-semibold text-gray-700">Status</Label>
          <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
            <SelectTrigger id="status" name="status" className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">🟢 Active</SelectItem>
              <SelectItem value="inactive">⚪ Inactive</SelectItem>
              <SelectItem value="discontinued">🔴 Discontinued</SelectItem>
              <SelectItem value="out_of_stock">🟠 Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">Current availability status</p>
        </div>
      </div>

      {specificVariant && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900">Creating product for:</h4>
                <p className="text-blue-700 text-lg">{specificVariant.name}</p>
                <p className="text-blue-600 text-sm mt-1">This product will be associated with the selected variant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDimensionsStep = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Size Configuration</h3>
          <p className="text-gray-600 mt-2">Configure single or multiple size variants for this product</p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="multiple-sizes" className="text-base font-semibold text-gray-700">Multiple Sizes</Label>
          <Switch
            id="multiple-sizes"
            checked={formData.has_multiple_sizes}
            onCheckedChange={(checked) => updateFormData('has_multiple_sizes', checked)}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {!formData.has_multiple_sizes ? (
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <Ruler className="w-4 h-4 text-white" />
              </div>
              Single Size Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="length" className="text-base font-semibold text-gray-700">Length (inches) *</Label>
                <Input
                  id="length"
                  name="length"
                  type="number"
                  autoComplete="off"
                  placeholder="48"
                  value={formData.dimensions.length}
                  onChange={(e) => updateFormData('dimensions.length', e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="width" className="text-base font-semibold text-gray-700">Width (inches) *</Label>
                <Input
                  id="width"
                  name="width"
                  type="number"
                  autoComplete="off"
                  placeholder="12"
                  value={formData.dimensions.width}
                  onChange={(e) => updateFormData('dimensions.width', e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="thickness" className="text-base font-semibold text-gray-700">Thickness (inches) *</Label>
                <Input
                  id="thickness"
                  name="thickness"
                  type="number"
                  autoComplete="off"
                  placeholder="6"
                  value={formData.dimensions.thickness}
                  onChange={(e) => updateFormData('dimensions.thickness', e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="area_per_piece" className="text-base font-semibold text-gray-700">Area per Piece (sq ft)</Label>
                <Input
                  id="area_per_piece"
                  name="area_per_piece"
                  type="number"
                  autoComplete="off"
                  placeholder="Auto-calculated"
                  value={formData.area_per_piece}
                  onChange={(e) => updateFormData('area_per_piece', e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">Leave empty for automatic calculation</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="weight_per_piece" className="text-base font-semibold text-gray-700">Weight per Piece (lbs)</Label>
                <Input
                  id="weight_per_piece"
                  name="weight_per_piece"
                  type="number"
                  autoComplete="off"
                  placeholder="150"
                  value={formData.weight_per_piece}
                  onChange={(e) => updateFormData('weight_per_piece', e.target.value)}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">Enter the weight of a single piece</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900">Size Variants</h4>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={addSizeVariant}
              className="flex items-center gap-2 border-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <Plus className="w-5 h-5" />
              Add Size Variant
            </Button>
          </div>

          {formData.size_variants.map((variant: any, index: number) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h5 className="text-lg font-semibold text-gray-900">Size Variant {index + 1}</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSizeVariant(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Size Name *</Label>
                    <Input
                      placeholder="e.g., 12x12x1.25"
                      value={variant.size_name}
                      onChange={(e) => updateSizeVariant(index, 'size_name', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Price per Piece *</Label>
                    <Input
                      type="number"
                      placeholder="25.00"
                      value={variant.price_per_piece}
                      onChange={(e) => updateSizeVariant(index, 'price_per_piece', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Length (in) *</Label>
                    <Input
                      type="number"
                      value={variant.dimensions.length}
                      onChange={(e) => updateSizeVariant(index, 'dimensions.length', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Width (in) *</Label>
                    <Input
                      type="number"
                      value={variant.dimensions.width}
                      onChange={(e) => updateSizeVariant(index, 'dimensions.width', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Thickness (in) *</Label>
                    <Input
                      type="number"
                      value={variant.dimensions.thickness}
                      onChange={(e) => updateSizeVariant(index, 'dimensions.thickness', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-blue-700">Stock Quantity *</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={variant.stock || ''}
                      onChange={(e) => updateSizeVariant(index, 'stock', e.target.value)}
                      className="h-12 text-base border-2 border-blue-300 focus:border-blue-500 bg-blue-50"
                    />
                    <p className="text-sm text-blue-600">Available inventory for this size</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Area per Piece (sq ft)</Label>
                    <Input
                      type="number"
                      placeholder="Auto-calculated"
                      value={variant.area_per_piece}
                      onChange={(e) => updateSizeVariant(index, 'area_per_piece', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500">Calculated from dimensions</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Weight per Piece (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={variant.weight_per_piece}
                      onChange={(e) => updateSizeVariant(index, 'weight_per_piece', e.target.value)}
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500">Weight of individual piece</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.size_variants.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors">
              <CardContent className="p-12 text-center">
                <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold text-gray-700 mb-3">No size variants added</h4>
                <p className="text-gray-500 mb-6">Add different size options for this product to give customers more choices</p>
                <Button 
                  onClick={addSizeVariant} 
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Size Variant
                </Button>
              </CardContent>
            </Card>
          )}

          {formData.size_variants.length > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900">Total Stock Summary</h4>
                      <p className="text-blue-700 text-sm">Combined inventory across all size variants</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-900">
                      {formData.size_variants.reduce((total: number, variant: any) => total + (parseInt(variant.stock) || 0), 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total Pieces</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {formData.size_variants.map((variant: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">{variant.size_name || `Size ${index + 1}`}:</span>
                      <span className="font-semibold text-blue-900">{variant.stock || 0} pieces</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderBusinessStep = () => (
    <div className="space-y-8">
      <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Business Configuration</h3>
        <p className="text-gray-600">Configure pricing structure, inventory settings, and business rules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              Pricing Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="price_per_unit" className="text-base font-semibold text-gray-700">Price per Unit ({formData.pricing.currency}) *</Label>
              <Input
                id="price_per_unit"
                name="price_per_unit"
                type="number"
                autoComplete="off"
                placeholder="15.00"
                value={formData.pricing.price_per_unit}
                onChange={(e) => updateFormData('pricing.price_per_unit', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-green-500"
              />
              <p className="text-sm text-gray-500">Base price per unit of measurement</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="price_per_sqft" className="text-base font-semibold text-gray-700">Price per Square Foot</Label>
              <Input
                id="price_per_sqft"
                name="price_per_sqft"
                type="number"
                autoComplete="off"
                placeholder="12.50"
                value={formData.pricing.price_per_sqft}
                onChange={(e) => updateFormData('pricing.price_per_sqft', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-green-500"
              />
              <p className="text-sm text-gray-500">Alternative pricing by area coverage</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="currency" className="text-base font-semibold text-gray-700">Currency</Label>
              <Select value={formData.pricing.currency} onValueChange={(value) => updateFormData('pricing.currency', value)}>
                <SelectTrigger id="currency" name="currency" className="h-12 text-base border-2 border-gray-200 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              Inventory & Packaging
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="stock" className="text-base font-semibold text-gray-700">Stock Quantity *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                autoComplete="off"
                placeholder="100"
                value={formData.stock}
                onChange={(e) => updateFormData('stock', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-orange-500"
              />
              <p className="text-sm text-gray-500">Current available inventory</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="unit_type" className="text-base font-semibold text-gray-700">Unit Type</Label>
              <Select value={formData.unit_type} onValueChange={(value) => updateFormData('unit_type', value)}>
                <SelectTrigger id="unit_type" name="unit_type" className="h-12 text-base border-2 border-gray-200 focus:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="crate">Crate</SelectItem>
                  <SelectItem value="slab">Slab</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">How this product is measured and sold</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">Pieces per Crate</Label>
              <Input
                type="number"
                placeholder="10"
                value={formData.packaging.pieces_per_crate}
                onChange={(e) => updateFormData('packaging.pieces_per_crate', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-orange-500"
              />
              <p className="text-sm text-gray-500">Packaging configuration for shipping</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            Advanced Business Logic
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">Max Shipping Weight (lbs)</Label>
              <Input
                type="number"
                placeholder="2000"
                value={formData.business_config.max_shipping_weight}
                onChange={(e) => updateFormData('business_config.max_shipping_weight', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500">Maximum weight per shipment</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">Filler Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="15"
                value={formData.business_config.filler_rate * 100}
                onChange={(e) => updateFormData('business_config.filler_rate', parseFloat(e.target.value) / 100)}
                className="h-12 text-base border-2 border-gray-200 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500">Percentage for filler calculations</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">Business Pieces per Crate</Label>
              <Input
                type="number"
                placeholder="12"
                value={formData.business_config.pieces_per_crate}
                onChange={(e) => updateFormData('business_config.pieces_per_crate', e.target.value)}
                className="h-12 text-base border-2 border-gray-200 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500">Business rule for crate configuration</p>
            </div>
          </div>
          
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Calculator className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Business Rules</h4>
                <p className="text-blue-700">These settings control automated calculations for shipping, packaging, and inventory management. Ensure values align with your business processes.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeaturesStep = () => (
    <div className="space-y-8">
      <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Features & Media</h3>
        <p className="text-gray-600">Configure product features, applications, and upload beautiful images</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Available Finishes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {FINISHES.map(finish => (
                <label key={finish.value} htmlFor={`finish-${finish.value}`} className="flex items-center space-x-4 p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-300 cursor-pointer transition-all group">
                  <input
                    id={`finish-${finish.value}`}
                    name={`finish-${finish.value}`}
                    type="checkbox"
                    checked={formData.finish.includes(finish.value)}
                    onChange={(e) => {
                      const newFinishes = e.target.checked
                        ? [...formData.finish, finish.value]
                        : formData.finish.filter((f: string) => f !== finish.value);
                      updateFormData('finish', newFinishes);
                    }}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-base font-medium text-gray-700 group-hover:text-emerald-700">{finish.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {APPLICATIONS.map(app => (
                <label key={app.value} htmlFor={`application-${app.value}`} className="flex items-center space-x-4 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all group">
                  <input
                    id={`application-${app.value}`}
                    name={`application-${app.value}`}
                    type="checkbox"
                    checked={formData.applications.includes(app.value)}
                    onChange={(e) => {
                      const newApps = e.target.checked
                        ? [...formData.applications, app.value]
                        : formData.applications.filter((a: string) => a !== app.value);
                      updateFormData('applications', newApps);
                    }}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700 group-hover:text-blue-700">{app.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {formData.images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-violet-300 transition-colors">
                    <img 
                      src={image} 
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-8 h-8 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-violet-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              
              {formData.images.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-violet-400 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all hover:bg-violet-50 group">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-violet-700">Upload Image</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  />
                </label>
              )}
            </div>
            
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Image Guidelines</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Upload up to 4 high-quality product images</li>
                    <li>• First image will be the primary product photo</li>
                    <li>• Recommended size: 1024x1024 pixels or larger</li>
                    <li>• Supported formats: JPG, PNG, WebP</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">
              {mode === 'create' ? 'Create New Product' : 'Edit Product'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your granite product with enhanced business logic support
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                        index <= currentStep 
                          ? `${step.color} text-white shadow-lg transform scale-110` 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index < currentStep ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <step.icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className={`text-sm font-medium transition-colors ${
                          index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-xs mt-1 transition-colors ${
                          index <= currentStep ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-4 mt-6 transition-all duration-300">
                        <div className={`h-full transition-all duration-500 ${
                          index < currentStep 
                            ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                            : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${steps[currentStep].color} flex items-center justify-center text-white`}>
                  {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
                  <p className="text-gray-600 mt-1">{steps[currentStep].description}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Footer */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 rounded-b-lg flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-3 h-12 px-6 border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold">Previous</span>
          </Button>

          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border-2 border-gray-200 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{steps[currentStep].title}</span>
          </div>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!validateStep(currentStep) || isSubmitting}
              className="flex items-center gap-3 h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="font-semibold">
                    {mode === 'create' ? 'Create Product' : 'Update Product'}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="flex items-center gap-3 h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg"
            >
              <span className="font-semibold">Next</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}