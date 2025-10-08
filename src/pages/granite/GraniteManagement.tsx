import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, Upload,
  Filter, Grid, List, Eye
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { graniteApi } from '../../services/graniteApi';
import { uploadPublicImage } from '../../services/uploadService';
import type { GraniteVariant, SpecificGraniteVariant, GraniteProduct } from '../../types';
import { EnhancedFormModal } from '../../components/ui/enhanced-form-modal';
import ModernProductForm from '../../components/forms/ModernProductForm';
import ModernProductDetails from '../../components/forms/ModernProductDetails';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ImportExportModal } from '../../components/ui/import-export-modal';
import DetailedViewModal from '../../components/ui/detailed-view-modal';
import { 
  StatusBadge, 
  SemanticCard,
  LoadingSpinner 
} from '../../components/ui/semantic-colors';

// Helper to invalidate all product queries regardless of their specific parameters
const invalidateProductQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ 
    predicate: (query: any) => 
      Array.isArray(query.queryKey) && query.queryKey[0] === 'products'
  });
  queryClient.invalidateQueries({ 
    predicate: (query: any) => 
      Array.isArray(query.queryKey) && query.queryKey[0] === 'allProducts'
  });
};

// Helper to invalidate all specific variant queries
const invalidateSpecificVariantQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ 
    predicate: (query: any) => 
      Array.isArray(query.queryKey) && query.queryKey[0] === 'specificVariants'
  });
  queryClient.invalidateQueries({ 
    predicate: (query: any) => 
      Array.isArray(query.queryKey) && query.queryKey[0] === 'allSpecificVariants'
  });
};

export default function GraniteManagement() {
  // Core state
  const [selectedVariant, setSelectedVariant] = useState<GraniteVariant | null>(null);
  const [selectedSpecificVariant, setSelectedSpecificVariant] = useState<SpecificGraniteVariant | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: 'all',
    priceRange: 'all',
    stockLevel: 'all',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  });



  // Modal states
  const [showModal, setShowModal] = useState<{
    type: 'variant' | 'specificVariant' | 'product' | 'delete' | null;
    mode: 'create' | 'edit' | 'delete';
    item?: any;
  }>({ type: null, mode: 'create' });

  // Hierarchy validation state
  const [dependencyInfo, setDependencyInfo] = useState<{
    canDelete: boolean;
    dependencies: any;
    message: string;
    totalDependents?: number;
  } | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);

  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportType] = useState<'variants' | 'specificVariants' | 'products' | 'hierarchy'>('variants');
  
  // Enhanced Detailed View Modal state
  const [detailedViewModal, setDetailedViewModal] = useState<{
    isOpen: boolean;
    type: 'variant' | 'specificVariant' | 'product';
    item: any;
  }>({
    isOpen: false,
    type: 'variant',
    item: null
  });

  const queryClient = useQueryClient();

  // Enhanced notification system
  const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    alert(`${emoji} ${type.toUpperCase()}: ${message}`);
  };

  // API queries
  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ['variants'],
    queryFn: graniteApi.getVariants,
  });

  const { data: specificVariantsData } = useQuery({
    queryKey: ['specificVariants', selectedVariant?._id],
    queryFn: () => selectedVariant 
      ? graniteApi.getSpecificVariantsByVariant(selectedVariant._id)
      : graniteApi.getSpecificVariants(),
    enabled: true, // Always enabled, will fetch all if no variant selected
  });

  // Separate query for getting all specific variants (for counts in variant grid)
  const { data: allSpecificVariantsData } = useQuery({
    queryKey: ['allSpecificVariants'],
    queryFn: graniteApi.getSpecificVariants,
    enabled: !selectedVariant, // Only fetch when no specific variant is selected
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', selectedSpecificVariant?._id],
    queryFn: async () => {
      if (selectedSpecificVariant) {
        const response = await graniteApi.getProductsBySpecificVariant(selectedSpecificVariant._id);
        // Normalize ApiResponse to match PaginatedResponse structure
        return {
          data: response.data,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data?.length || 0,
            itemsPerPage: response.data?.length || 0
          }
        };
      } else {
        return graniteApi.getProducts();
      }
    },
    enabled: true,
  });

  // Separate query for getting all products (for counts in specific variant grid)
  const { data: allProductsData } = useQuery({
    queryKey: ['allProducts'],
    queryFn: graniteApi.getProducts,
    enabled: !selectedSpecificVariant, // Only fetch when no specific variant is selected
  });

  // Mutations
  const createVariantMutation = useMutation({
    mutationFn: graniteApi.createVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      notify('Granite variant created successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to create variant: ${error.message}`, 'error'),
  });

  const createSpecificVariantMutation = useMutation({
    mutationFn: graniteApi.createSpecificVariant,
    onSuccess: () => {
      invalidateSpecificVariantQueries(queryClient);
      notify('Specific variant created successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to create specific variant: ${error.message}`, 'error'),
  });

  const createProductMutation = useMutation({
    mutationFn: graniteApi.createProduct,
    onSuccess: () => {
      invalidateProductQueries(queryClient);
      notify('Product created successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to create product: ${error.message}`, 'error'),
  });

  // Update mutations
  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      notify('Variant updated successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to update variant: ${error.message}`, 'error'),
  });

  const updateSpecificVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateSpecificVariant(id, data),
    onSuccess: () => {
      invalidateSpecificVariantQueries(queryClient);
      notify('Specific variant updated successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to update specific variant: ${error.message}`, 'error'),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateProduct(id, data),
    onSuccess: () => {
      invalidateProductQueries(queryClient);
      notify('Product updated successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to update product: ${error.message}`, 'error'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      switch (type) {
        case 'variant':
          return graniteApi.deleteVariant(id);
        case 'specificVariant':
          return graniteApi.deleteSpecificVariant(id);
        case 'product':
          return graniteApi.deleteProduct(id);
        default:
          throw new Error('Invalid type');
      }
    },
    onSuccess: (_, { type }) => {
      // Invalidate queries with proper key structure
      if (type === 'specificVariant') {
        invalidateSpecificVariantQueries(queryClient);
        // Also invalidate products as they depend on specific variants
        invalidateProductQueries(queryClient);
      } else if (type === 'product') {
        invalidateProductQueries(queryClient);
      } else {
        queryClient.invalidateQueries({ queryKey: [`${type}s`] });
      }
      notify(`${type} deleted successfully!`);
      setShowModal({ type: null, mode: 'create' });
      setDependencyInfo(null);
    },
    onError: (error: any) => {
      // Handle hierarchy validation errors from backend
      if (error.response?.status === 400 && error.response?.data) {
        const errorData = error.response.data;
        if (errorData.dependentCount) {
          notify(`Cannot delete: ${errorData.message}`, 'error');
        } else {
          notify(errorData.message || 'Failed to delete item', 'error');
        }
      } else {
        notify(error.response?.data?.message || error.message || 'Failed to delete item', 'error');
      }
    },
  });

  // Data processing
  const variantsArray = variantsData?.data || [];
  const specificVariantsArray = useMemo(() => {
    // The API now returns filtered results based on selectedVariant
    return specificVariantsData?.data || [];
  }, [specificVariantsData]);

  const productsArray = useMemo(() => {
    // The API now returns filtered results based on selectedSpecificVariant
    return productsData?.data || [];
  }, [productsData]);

  // Analytics
  const analytics = useMemo(() => {
    const totalProducts = productsArray.length;
    const inStockProducts = productsArray.filter(p => (p.stock || 0) > 0).length;
    const outOfStockProducts = totalProducts - inStockProducts;
    const totalValue = productsArray.reduce((sum, p) => sum + ((p.basePrice || 0) * (p.stock || 0)), 0);

    return {
      totalProducts,
      inStockProducts,
      outOfStockProducts,
      totalValue,
      activeProducts: productsArray.filter(p => p.status === 'active').length,
    };
  }, [productsArray]);

  // Event handlers
  const openCreateModal = (type: 'variant' | 'specificVariant' | 'product') => {
    setShowModal({ type, mode: 'create' });
  };

  const openEditModal = (type: 'variant' | 'specificVariant' | 'product', item: any) => {
    setShowModal({ type, mode: 'edit', item });
  };

  const openDeleteModal = async (type: 'variant' | 'specificVariant' | 'product', item: any) => {
    // For products, no dependency check needed (always deletable)
    if (type === 'product') {
      setShowModal({ type: 'delete', mode: 'delete', item: { ...item, deleteType: type } });
      setDependencyInfo({ canDelete: true, dependencies: {}, message: 'Products can always be deleted (soft delete)' });
      return;
    }

    // Check dependencies for variants and specific variants
    setCheckingDependencies(true);
    setShowModal({ type: 'delete', mode: 'delete', item: { ...item, deleteType: type } });
    setDependencyInfo({ canDelete: false, dependencies: {}, message: 'Checking dependencies...' });
    
    try {
      let response;
      if (type === 'variant') {
        response = await graniteApi.checkVariantDependencies(item._id);
      } else {
        response = await graniteApi.checkSpecificVariantDependencies(item._id);
      }
      
      // Response is already the dependency info object (apiService.get extracts response.data)
      setDependencyInfo(response as any || null);
    } catch (error) {
      console.error('Error checking dependencies:', error);
      setDependencyInfo({ 
        canDelete: false, 
        dependencies: {}, 
        message: 'Failed to check dependencies. Please try again.' 
      });
      notify('Failed to check dependencies', 'error');
    } finally {
      setCheckingDependencies(false);
    }
  };

  // Helper function to flatten nested product data for form editing
  const transformProductForEdit = (product: any) => {
    if (!product) return {};
    
    const transformed = {
      // Basic fields
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      status: product.status || 'active',
      
      // Size variants handling
      has_multiple_sizes: product.has_multiple_sizes || false,
      size_variants: product.size_variants || [],
      
      // Flattened dimensions for single size products
      dimensions: product.dimensions || { length: '', width: '', thickness: '', unit: 'inches' },
      
      // Keep nested business_config structure
      business_config: product.business_config || {
        pieces_per_crate: 10,
        filler_rate: 0.5,
        max_shipping_weight: 48000,
        weight_unit: 'lbs'
      },
      
      // Keep nested packaging structure  
      packaging: product.packaging || {
        pieces_per_crate: 10,
        pieces_per_set: '',
        crate_weight: '',
        pieces_weight: ''
      },
      
      // Keep nested pricing structure
      pricing: product.pricing || {
        price_per_unit: product.basePrice || '',
        price_per_sqft: '',
        price_per_piece: '',
        price_per_set: '',
        currency: 'USD'
      },
      
      // Other fields
      area_per_piece: product.area_per_piece || product.calculatedAreaPerPiece || '',
      weight_per_piece: product.weight_per_piece || '',
      stock: product.stock || 0,
      unit_type: product.unit_type || product.unit || 'sqft',
      
      // Arrays - handle differently based on field type
      finish: Array.isArray(product.finish) 
        ? product.finish.map((f: any) => typeof f === 'object' && f ? (f.value || f.name || f.label || String(f)) : String(f || ''))
        : (product.finish ? [typeof product.finish === 'object' && product.finish ? (product.finish.value || product.finish.name || product.finish.label || String(product.finish)) : String(product.finish)] : []),
      applications: Array.isArray(product.applications) 
        ? product.applications.map((a: any) => typeof a === 'object' && a ? (a.value || a.name || a.label || String(a)) : String(a || ''))
        : (product.applications ? [typeof product.applications === 'object' && product.applications ? (product.applications.value || product.applications.name || product.applications.label || String(product.applications)) : String(product.applications)] : []),
      special_features: Array.isArray(product.special_features) 
        ? product.special_features.map((sf: any) => typeof sf === 'object' && sf ? (sf.value || sf.name || sf.label || String(sf)) : String(sf || ''))
        : (product.special_features ? [typeof product.special_features === 'object' && product.special_features ? (product.special_features.value || product.special_features.name || product.special_features.label || String(product.special_features)) : String(product.special_features)] : []),
      
      // Legacy compatibility - individual fields for backward compatibility
      basePrice: product.basePrice || product.pricing?.price_per_unit || '',
      unit: product.unit || product.unit_type || 'sqft',
      
      // Images - preserve existing images URLs for display
      images: product.images || [],
      
      // Keep empty for new uploads in edit mode
      imageFiles: []
    };
    
    return transformed;
  };

  const transformVariantForEdit = (variant: any) => {
    if (!variant) return {};
    
    return {
      name: String(variant.name || ''),
      description: String(variant.description || ''),
      // Don't include image in form edit - handled separately
    };
  };

  const transformSpecificVariantForEdit = (specificVariant: any) => {
    if (!specificVariant) return {};
    
    return {
      name: String(specificVariant.name || ''),
      description: String(specificVariant.description || ''),
      // Don't include image in form edit - handled separately
    };
  };

  // Memoize the transformed data to prevent unnecessary re-renders
  const memoizedInitialData = useMemo(() => {
    if (showModal.mode === 'edit' && showModal.item) {
      switch (showModal.type) {
        case 'product':
          return transformProductForEdit(showModal.item);
        case 'variant':
          return transformVariantForEdit(showModal.item);
        case 'specificVariant':
          return transformSpecificVariantForEdit(showModal.item);
        default:
          return showModal.item;
      }
    }
    return undefined;
  }, [showModal.mode, showModal.type, showModal.item]);

  const handleCreate = async (data: any) => {
    try {
      // Handle image uploads
      const processedData = { ...data };
      
      // For single image (variants and specific variants)
      if (data.image && data.image instanceof File) {
        try {
          const uploadResponse = await uploadPublicImage(data.image);
          if (uploadResponse.success && uploadResponse.data?.url) {
            processedData.image = uploadResponse.data.url;
          } else {
            notify('Failed to upload image', 'error');
            return;
          }
        } catch (error) {
          notify('Failed to upload image', 'error');
          return;
        }
      }
      
      // For multiple images (products)
      if (showModal.type === 'product') {
        const productImages: string[] = [];
        
        // Handle multiple individual image uploads
        for (let i = 1; i <= 4; i++) {
          const imageKey = `image${i}`;
          if (data[imageKey] && data[imageKey] instanceof File) {
            try {
              const uploadResponse = await uploadPublicImage(data[imageKey]);
              if (uploadResponse.success && uploadResponse.data?.url) {
                productImages.push(uploadResponse.data.url);
              } else {
                notify(`Failed to upload image ${i}`, 'error');
                return;
              }
            } catch (error) {
              notify(`Failed to upload image ${i}`, 'error');
              return;
            }
          }
          // Remove the individual image keys from processed data
          delete processedData[imageKey];
        }
        
        // Set the images array
        if (productImages.length > 0) {
          processedData.images = productImages;
        }
      }
      
      // Convert comma-separated strings to arrays for products
      if (showModal.type === 'product') {
        // Handle finish array (might be from multiselect or comma-separated)
        if (typeof processedData.finish === 'string') {
          processedData.finish = processedData.finish
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Handle applications array (might be from multiselect or comma-separated)
        if (typeof processedData.applications === 'string') {
          processedData.applications = processedData.applications
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Handle special_features array
        if (typeof processedData.special_features === 'string') {
          processedData.special_features = processedData.special_features
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Ensure numeric fields are properly typed - New structure
        processedData.length = Number(processedData.length);
        processedData.width = Number(processedData.width);
        processedData.thickness = Number(processedData.thickness);
        processedData.pieces_per_crate = Number(processedData.pieces_per_crate);
        processedData.stock = Number(processedData.stock);
        processedData.price_per_unit = Number(processedData.price_per_unit);
        
        // Optional numeric fields
        if (processedData.weight_per_piece) {
          processedData.weight_per_piece = Number(processedData.weight_per_piece);
        }
        if (processedData.area_per_piece) {
          processedData.area_per_piece = Number(processedData.area_per_piece);
        }
        if (processedData.pieces_per_set) {
          processedData.pieces_per_set = Number(processedData.pieces_per_set);
        }
        if (processedData.crate_weight) {
          processedData.crate_weight = Number(processedData.crate_weight);
        }
        if (processedData.price_per_sqft) {
          processedData.price_per_sqft = Number(processedData.price_per_sqft);
        }
        if (processedData.price_per_piece) {
          processedData.price_per_piece = Number(processedData.price_per_piece);
        }
        if (processedData.price_per_set) {
          processedData.price_per_set = Number(processedData.price_per_set);
        }
        
        // Legacy compatibility - ensure these are set
        processedData.basePrice = Number(processedData.basePrice || processedData.price_per_unit);
        processedData.unit = processedData.unit || processedData.unit_type || 'sqft';
      }      switch (showModal.type) {
        case 'variant':
          await createVariantMutation.mutateAsync(processedData);
          break;
        case 'specificVariant':
          await createSpecificVariantMutation.mutateAsync({
            ...processedData,
            variantId: selectedVariant?._id,
          });
          break;
        case 'product':
          await createProductMutation.mutateAsync({
            ...processedData,
            variantSpecificId: selectedSpecificVariant?._id,
          });
          break;
      }
    } catch (error) {
      console.error('Error creating item:', error);
      notify('Failed to create item', 'error');
    }
  };

  const handleEdit = async (data: any) => {
    if (!showModal.item) return;
    
    try {
      // Handle image uploads
      const processedData = { ...data };
      
      // For single image (variants and specific variants)
      if (data.image && data.image instanceof File) {
        try {
          const uploadResponse = await uploadPublicImage(data.image);
          if (uploadResponse.success && uploadResponse.data?.url) {
            processedData.image = uploadResponse.data.url;
          } else {
            notify('Failed to upload image', 'error');
            return;
          }
        } catch (error) {
          notify('Failed to upload image', 'error');
          return;
        }
      }
      
      // For multiple images (products)
      if (showModal.type === 'product') {
        const productImages: string[] = [];
        
        // Handle multiple individual image uploads
        for (let i = 1; i <= 4; i++) {
          const imageKey = `image${i}`;
          if (data[imageKey] && data[imageKey] instanceof File) {
            try {
              const uploadResponse = await uploadPublicImage(data[imageKey]);
              if (uploadResponse.success && uploadResponse.data?.url) {
                productImages.push(uploadResponse.data.url);
              } else {
                notify(`Failed to upload image ${i}`, 'error');
                return;
              }
            } catch (error) {
              notify(`Failed to upload image ${i}`, 'error');
              return;
            }
          }
          // Remove the individual image keys from processed data
          delete processedData[imageKey];
        }
        
        // Set the images array only if new images were uploaded
        if (productImages.length > 0) {
          processedData.images = productImages;
        }
      }
      
      // Convert comma-separated strings to arrays for products
      if (showModal.type === 'product') {
        // Handle finish array (might be from multiselect or comma-separated)
        if (typeof processedData.finish === 'string') {
          processedData.finish = processedData.finish
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Handle applications array (might be from multiselect or comma-separated)
        if (typeof processedData.applications === 'string') {
          processedData.applications = processedData.applications
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Handle special_features array
        if (typeof processedData.special_features === 'string') {
          processedData.special_features = processedData.special_features
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }
        
        // Ensure numeric fields are properly typed - New structure
        processedData.length = Number(processedData.length);
        processedData.width = Number(processedData.width);
        processedData.thickness = Number(processedData.thickness);
        processedData.pieces_per_crate = Number(processedData.pieces_per_crate);
        processedData.stock = Number(processedData.stock);
        processedData.price_per_unit = Number(processedData.price_per_unit);
        
        // Optional numeric fields
        if (processedData.weight_per_piece) {
          processedData.weight_per_piece = Number(processedData.weight_per_piece);
        }
        if (processedData.area_per_piece) {
          processedData.area_per_piece = Number(processedData.area_per_piece);
        }
        if (processedData.pieces_per_set) {
          processedData.pieces_per_set = Number(processedData.pieces_per_set);
        }
        if (processedData.crate_weight) {
          processedData.crate_weight = Number(processedData.crate_weight);
        }
        if (processedData.price_per_sqft) {
          processedData.price_per_sqft = Number(processedData.price_per_sqft);
        }
        if (processedData.price_per_piece) {
          processedData.price_per_piece = Number(processedData.price_per_piece);
        }
        if (processedData.price_per_set) {
          processedData.price_per_set = Number(processedData.price_per_set);
        }
        
        // Legacy compatibility - ensure these are set
        processedData.basePrice = Number(processedData.basePrice || processedData.price_per_unit);
        processedData.unit = processedData.unit || processedData.unit_type || 'sqft';
      }

      // Prepare final data for API call
      let finalData;
      if (showModal.type === 'product') {
        // Check if this is a multi-size product with size variants
        if (processedData.has_multiple_sizes && processedData.size_variants?.length > 0) {
          // For multi-size products, use the new structure
          finalData = {
            // Basic fields
            name: processedData.name,
            category: processedData.category,
            subcategory: processedData.subcategory,
            status: processedData.status,
            
            // Multi-size product structure
            has_multiple_sizes: true,
            size_variants: processedData.size_variants,
            
            // Business config (if provided)
            ...(processedData.business_config && { business_config: processedData.business_config }),
            
            // Packaging (if provided)
            ...(processedData.packaging && { packaging: processedData.packaging }),
            
            // Pricing (if provided)
            ...(processedData.pricing && { pricing: processedData.pricing }),
            
            // Other fields
            stock: processedData.stock || 0,
            unit_type: processedData.unit_type,
            finish: processedData.finish,
            applications: processedData.applications,
            special_features: processedData.special_features,
            
            // Legacy compatibility
            basePrice: processedData.basePrice || processedData.pricing?.price_per_unit,
            unit: processedData.unit || processedData.unit_type || 'sqft',
            
            // Include images if uploaded
            ...(processedData.images && { images: processedData.images }),
            
            // Include variant ID if present
            ...(processedData.variantSpecificId && { variantSpecificId: processedData.variantSpecificId })
          };
        } else {
          // For single-size products, use the old flat structure
          finalData = {
            // Basic fields
            name: processedData.name,
            category: processedData.category,
            subcategory: processedData.subcategory,
            status: processedData.status,
            
            // Nested dimensions for single size products
            dimensions: {
              length: processedData.length || processedData.dimensions?.length,
              width: processedData.width || processedData.dimensions?.width,
              thickness: processedData.thickness || processedData.dimensions?.thickness,
              unit: 'inches'
            },
            
            // Nested packaging
            packaging: {
              pieces_per_crate: processedData.pieces_per_crate || processedData.packaging?.pieces_per_crate,
              ...(processedData.pieces_per_set && { pieces_per_set: processedData.pieces_per_set }),
              ...(processedData.crate_weight && { crate_weight: processedData.crate_weight })
            },
            
            // Nested pricing
            pricing: {
              price_per_unit: processedData.price_per_unit || processedData.pricing?.price_per_unit,
              currency: processedData.currency || processedData.pricing?.currency || 'USD',
              ...(processedData.price_per_sqft && { price_per_sqft: processedData.price_per_sqft }),
              ...(processedData.price_per_piece && { price_per_piece: processedData.price_per_piece }),
              ...(processedData.price_per_set && { price_per_set: processedData.price_per_set })
            },
            
            // Other fields
            ...(processedData.area_per_piece && { area_per_piece: processedData.area_per_piece }),
            ...(processedData.weight_per_piece && { weight_per_piece: processedData.weight_per_piece }),
            stock: processedData.stock,
            unit_type: processedData.unit_type,
            finish: processedData.finish,
            applications: processedData.applications,
            special_features: processedData.special_features,
            
            // Legacy compatibility
            basePrice: processedData.basePrice,
            unit: processedData.unit,
            
            // Include images if uploaded
            ...(processedData.images && { images: processedData.images })
          };
        }
      } else {
        finalData = processedData;
      }

      switch (showModal.type) {
        case 'variant':
          await updateVariantMutation.mutateAsync({
            id: showModal.item._id,
            data: finalData,
          });
          break;
        case 'specificVariant':
          await updateSpecificVariantMutation.mutateAsync({
            id: showModal.item._id,
            data: {
              ...finalData,
              variantId: selectedVariant?._id || showModal.item.variantId,
            },
          });
          break;
        case 'product':
          await updateProductMutation.mutateAsync({
            id: showModal.item._id,
            data: {
              ...finalData,
              variantSpecificId: selectedSpecificVariant?._id || showModal.item.variantSpecificId,
            },
          });
          break;
      }
    } catch (error) {
      console.error('Error updating item:', error);
      notify('Failed to update item', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showModal.item) return;

    // Check if item can be deleted
    if (dependencyInfo && !dependencyInfo.canDelete) {
      notify(`Cannot delete: ${dependencyInfo.message}`, 'error');
      return;
    }

    try {
      const deleteType = showModal.item.deleteType || 'product';
      await deleteItemMutation.mutateAsync({
        type: deleteType,
        id: showModal.item._id,
      });
      
      // Reset dependency info on success
      setDependencyInfo(null);
    } catch (error) {
      // Error handling is done in the mutation's onError handler
      console.error('Delete operation failed:', error);
    }
  };



  const handleImportComplete = () => {
    queryClient.invalidateQueries();
    notify('Data imported successfully!');
    setShowImportExportModal(false);
  };

  const handleExportComplete = () => {
    notify('Data exported successfully!');
  };

  const getCurrentExportData = () => {
    switch (importExportType) {
      case 'variants':
        return variantsArray;
      case 'specificVariants':
        return specificVariantsArray;
      case 'products':
        return productsArray;
      default:
        return [];
    }
  };

  // Filtered data
  const getFilteredVariants = useMemo(() => {
    return variantsArray.filter(variant => 
      variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (variant.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [variantsArray, searchTerm]);

  const getFilteredSpecificVariants = useMemo(() => {
    return specificVariantsArray.filter(variant => 
      variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (variant.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [specificVariantsArray, searchTerm]);

  const getFilteredProducts = useMemo(() => {
    return productsArray.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || product.status === filters.status;
      const matchesStock = filters.stockLevel === 'all' || 
        (filters.stockLevel === 'inStock' && (product.stock || 0) > 0) ||
        (filters.stockLevel === 'lowStock' && (product.stock || 0) > 0 && (product.stock || 0) <= 10) ||
        (filters.stockLevel === 'outOfStock' && (product.stock || 0) <= 0);
      
      return matchesSearch && matchesStatus && matchesStock;
    });
  }, [productsArray, searchTerm, filters]);

  if (loadingVariants) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading granite management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 lg:p-6">
      {/* Enhanced Header - Mobile Responsive */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">🧱 Granite Management</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your granite variants, specific variants, and products</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowImportExportModal(true)}
              className="flex-1 sm:flex-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Import/Export</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-Responsive Navigation Breadcrumb */}
      <SemanticCard variant="primary" className="mb-4 sm:mb-6">
        <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Navigation Steps - Mobile Stack, Desktop Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
              <Button 
                variant={!selectedVariant ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSelectedVariant(null);
                  setSelectedSpecificVariant(null);
                }}
                className={`${!selectedVariant ? 'bg-granite-variant hover:bg-granite-variant-hover text-white' : 'hover:bg-granite-variant-light'} transition-all justify-start sm:justify-center`}
              >
                🧱 Granite Variants
                {!selectedVariant && <Badge className="ml-2 bg-card text-granite-variant">{variantsArray.length}</Badge>}
              </Button>
              
              {selectedVariant && (
                <>
                  <span className="hidden sm:inline text-2xl text-muted">→</span>
                  <Button 
                    variant={!selectedSpecificVariant ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedSpecificVariant(null)}
                    className={`${!selectedSpecificVariant ? 'bg-granite-specific hover:bg-granite-specific-hover text-white' : 'hover:bg-granite-specific-light'} transition-all justify-start sm:justify-center`}
                  >
                    💎 {selectedVariant.name} 
                    <span className="hidden sm:inline"> Variants</span>
                    {!selectedSpecificVariant && <Badge className="ml-2 bg-card text-granite-specific">{specificVariantsArray.length}</Badge>}
                  </Button>
                </>
              )}
              
              {selectedSpecificVariant && (
                <>
                  <span className="hidden sm:inline text-2xl text-muted">→</span>
                  <div className="bg-granite-product text-white px-3 py-2 rounded-lg font-medium text-sm">
                    📦 {selectedSpecificVariant.name} 
                    <span className="hidden sm:inline"> Products</span>
                    <Badge className="ml-2 bg-card text-granite-product">{productsArray.length}</Badge>
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Actions - Mobile Full Width */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowImportExportModal(true)}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-1" />
                <span className="sm:hidden">Import/Export</span>
                <span className="hidden sm:inline">Import/Export</span>
              </Button>
              {selectedVariant && !selectedSpecificVariant && (
                <Button 
                  size="sm" 
                  onClick={() => openCreateModal('specificVariant')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="sm:hidden">Add Variant</span>
                  <span className="hidden sm:inline">Add Specific Variant</span>
                </Button>
              )}
              {selectedSpecificVariant && (
                <Button 
                  size="sm" 
                  onClick={() => openCreateModal('product')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              )}
              {!selectedVariant && (
                <Button 
                  size="sm" 
                  onClick={() => openCreateModal('variant')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </SemanticCard>

      {/* Main Content Area - Simple Hierarchical View */}
      {!selectedVariant ? (
        /* LEVEL 1: GRANITE VARIANTS VIEW */
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile-Responsive Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <SemanticCard variant="primary" className="text-center">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-granite-variant">{variantsArray.length}</div>
                <div className="text-xs sm:text-sm text-granite-variant-dark">🧱 Base Variants</div>
              </CardContent>
            </SemanticCard>
            <SemanticCard variant="info" className="text-center">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-granite-specific">{allSpecificVariantsData?.data?.length || specificVariantsData?.data?.length || 0}</div>
                <div className="text-xs sm:text-sm text-granite-specific-dark">💎 Specific Variants</div>
              </CardContent>
            </SemanticCard>
            <SemanticCard variant="success" className="text-center">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-granite-product">{allProductsData?.data?.length || productsData?.data?.length || 0}</div>
                <div className="text-xs sm:text-sm text-granite-product-dark">📦 Total Products</div>
              </CardContent>
            </SemanticCard>
            <SemanticCard variant="warning" className="col-span-2 sm:col-span-1 text-center">
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-warning">₹{analytics.totalValue?.toLocaleString() || '0'}</div>
                <div className="text-xs sm:text-sm text-warning-dark">💰 Total Value</div>
              </CardContent>
            </SemanticCard>
          </div>

          {/* Mobile-Responsive Search & Filter */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="🔍 Search granite variants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" className="sm:flex-shrink-0">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile-Responsive Granite Variants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {getFilteredVariants.map((variant: GraniteVariant) => (
              <Card 
                key={variant._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105 border-2 hover:border-primary-light"
                onClick={() => setSelectedVariant(variant)}
              >
                {/* Mobile-Optimized Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-background to-muted overflow-hidden rounded-t-lg">
                  <img
                    src={variant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIj7wn6e1IEdyYW5pdGUgVmFyaWFudDwvdGV4dD4KPHN2Zz4K'}
                    alt={variant.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIj7wn6e1IEdyYW5pdGUgVmFyaWFudDwvdGV4dD4KPHN2Zz4K';
                    }}
                  />
                  
                  {/* Mobile-Friendly Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                      <div className="text-white text-center">
                        <div className="text-xs sm:text-sm font-medium">Click to explore</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">View specific variants & products</div>
                      </div>
                    </div>
                    
                    {/* Touch-Friendly Action Buttons */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 sm:h-8 sm:w-8 p-0 bg-card/90 hover:bg-card touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal('variant', variant);
                        }}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 sm:h-8 sm:w-8 p-0 bg-error hover:bg-error-hover touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal('variant', variant);
                        }}
                        disabled={checkingDependencies}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </Button>
                    </div>
                  </div>

                </div>

                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                        🧱 {variant.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {variant.description || 'Premium granite variant with excellent quality and durability'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <span className="hidden sm:inline">Created: </span>
                        {new Date(variant.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                        })}
                      </div>
                      <StatusBadge status="success" className="text-xs">
                        ✅ Active
                      </StatusBadge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Mobile-Friendly Add New Variant Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 border-2 border-dashed border-muted hover:border-primary bg-gradient-to-br from-background to-primary-lighter touch-manipulation"
              onClick={() => openCreateModal('variant')}
            >
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full min-h-[180px] sm:min-h-[200px]">
                <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors mb-3 sm:mb-4" />
                <h3 className="font-medium text-sm sm:text-base text-muted-foreground group-hover:text-primary transition-colors">
                  Add New Granite Variant
                </h3>
                <p className="text-xs sm:text-sm text-muted mt-1 sm:mt-2">
                  Create a new base granite variant
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !selectedSpecificVariant ? (
        /* LEVEL 2: SPECIFIC VARIANTS VIEW */
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile-Responsive Variant Header */}
          <SemanticCard variant="info">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img
                    src={selectedVariant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzZiNzI4MCI+8J+ntTwvdGV4dD4KPHN2Zz4K'}
                    alt={selectedVariant.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">🧱 {selectedVariant.name}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">{selectedVariant.description || 'Base granite variant'}</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-granite-specific">{specificVariantsArray.length}</div>
                  <div className="text-xs sm:text-sm text-granite-specific-dark">Specific Variants</div>
                </div>
              </div>
            </CardContent>
          </SemanticCard>

          {/* Mobile-Responsive Quick Search */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="🔍 Search specific variants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile-Responsive Specific Variants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {getFilteredSpecificVariants.map((specificVariant: SpecificGraniteVariant) => (
              <Card 
                key={specificVariant._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-2 hover:border-purple-300"
                onClick={() => setSelectedSpecificVariant(specificVariant)}
              >
                {/* Enhanced Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-info-lighter to-pink-50 overflow-hidden rounded-t-lg">
                  <img
                    src={specificVariant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNlOGZmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTMzM2VhIj7wn5KOIFNwZWNpZmljIFZhcmlhbnQ8L3RleHQ+Cjwvc3ZnPgo='}
                    alt={specificVariant.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNlOGZmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTMzM2VhIj7wn5KOIFNwZWNpZmljIFZhcmlhbnQ8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white text-center">
                        <div className="text-sm font-medium">Click to explore</div>
                        <div className="text-xs text-muted">View products for this variant</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-card/90 hover:bg-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal('specificVariant', specificVariant);
                        }}
                      >
                        <Edit className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-error/90 hover:bg-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal('specificVariant', specificVariant);
                        }}
                        disabled={checkingDependencies}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>

                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-info transition-colors">
                        💎 {specificVariant.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {specificVariant.description || 'Premium specific variant with enhanced characteristics'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(specificVariant.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary" className="bg-info-light text-purple-800">
                        ⭐ Premium
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Specific Variant Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 border-2 border-dashed border-input hover:border-purple-400 bg-gradient-to-br from-background to-purple-50"
              onClick={() => openCreateModal('specificVariant')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-muted-foreground group-hover:text-purple-500 transition-colors mb-4" />
                <h3 className="font-medium text-muted-foreground group-hover:text-info transition-colors">
                  Add New Specific Variant
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a specific variant for {selectedVariant.name}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* LEVEL 3: PRODUCTS VIEW */
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile-Responsive Product Header */}
          <Card className="bg-gradient-to-r from-success-lighter to-primary-lighter border-success-light">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img
                    src={selectedSpecificVariant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNlOGZmIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzkzMzNlYSI+8J+SjjwvdGV4dD4KPHN2Zz4K'}
                    alt={selectedSpecificVariant.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">📦 {selectedSpecificVariant.name} <span className="hidden sm:inline">Products</span></h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      <span className="hidden sm:inline">Products for {selectedVariant.name} → {selectedSpecificVariant.name}</span>
                      <span className="sm:hidden">{selectedVariant.name} Products</span>
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-success">{productsArray.length}</div>
                  <div className="text-xs sm:text-sm text-success">Products Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile-Responsive Products Controls */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                    <SelectTrigger className="w-32 sm:w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">📝 Name</SelectItem>
                      <SelectItem value="price">💰 Price</SelectItem>
                      <SelectItem value="stock">📦 Stock</SelectItem>
                      <SelectItem value="createdAt">📅 Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="flex-shrink-0"
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile-Responsive Products Grid */}
          <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {getFilteredProducts.map((product: GraniteProduct) => (
              <Card 
                key={product._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105 border-2 hover:border-green-300"
                onClick={() => setDetailedViewModal({
                  isOpen: true,
                  type: 'product',
                  item: product
                })}
              >
                {/* Mobile-Optimized Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-success-lighter to-primary-lighter overflow-hidden rounded-t-lg">
                  <img
                    src={(product.images && product.images.length > 0 ? product.images[0] : '') || 
                         'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZGNmY2U3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMTZhMzRhIj7wn5OmIFByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo='}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZGNmY2U3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMTZhMzRhIj7wn5OmIFByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  
                  {/* Mobile-Friendly Stock Status Badge */}
                  <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 rounded-full text-xs font-medium ${
                    (product.stock || 0) <= 0 ? 'bg-error text-white' :
                    (product.stock || 0) <= 10 ? 'bg-warning text-white' :
                    'bg-success text-white'
                  }`}>
                    {(product.stock || 0) <= 0 ? '❌' :
                     (product.stock || 0) <= 10 ? '⚠️' :
                     `✅`}
                    <span className="hidden sm:inline ml-1">
                      {(product.stock || 0) <= 0 ? ' Out of Stock' :
                       (product.stock || 0) <= 10 ? ' Low Stock' :
                       ` ${product.stock} in stock`}
                    </span>
                  </div>

                  {/* Multiple Images Indicator */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      🖼️ <span className="hidden sm:inline">{product.images.length} photos</span>
                      <span className="sm:hidden">{product.images.length}</span>
                    </div>
                  )}
                  
                  {/* Mobile-Optimized Price Badge */}
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-success text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    ₹{product.basePrice?.toLocaleString() || 'N/A'}
                  </div>

                  {/* Touch-Friendly Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-card/90 hover:bg-card text-foreground text-xs sm:text-sm touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailedViewModal({
                            isOpen: true,
                            type: 'product',
                            item: product
                          });
                        }}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-success transition-colors line-clamp-1">
                        📦 {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        📏 {product.unit || 'sq_ft'} • 
                        {product.finish && product.finish.length > 0 ? ` ${product.finish.length} finishes` : ' Standard finish'}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge variant="secondary" className="bg-success-light text-success text-xs">
                        📦 {product.stock || 0}
                        <span className="hidden sm:inline"> units</span>
                      </Badge>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'} 
                             className={`text-xs ${product.status === 'active' ? 'bg-success-light text-success' : ''}`}>
                        {product.status === 'active' ? '✅' : '⏸️'} 
                        <span className="hidden sm:inline ml-1">{product.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        {new Date(product.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                        })}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal('product', product);
                          }}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal('product', product);
                          }}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Mobile-Friendly Add New Product Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 border-2 border-dashed border-input hover:border-green-400 bg-gradient-to-br from-background to-green-50 touch-manipulation"
              onClick={() => openCreateModal('product')}
            >
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full min-h-[180px] sm:min-h-[200px]">
                <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-green-500 transition-colors mb-3 sm:mb-4" />
                <h3 className="font-medium text-sm sm:text-base text-muted-foreground group-hover:text-success transition-colors">
                  Add New Product
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                  <span className="hidden sm:inline">Create a product for {selectedSpecificVariant.name}</span>
                  <span className="sm:hidden">Add product for {selectedSpecificVariant.name}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile-Responsive Enhanced Modals */}
      <EnhancedFormModal
        isOpen={showModal.type !== null && showModal.type !== 'delete' && showModal.type !== 'product'}
        onClose={() => setShowModal({ type: null, mode: 'create' })}
        title={showModal.mode === 'create' ? `Add New ${showModal.type}` : `Edit ${showModal.type}`}
        description={
          showModal.type === 'variant' ? 'Create a new granite variant with essential details' :
          showModal.type === 'specificVariant' ? `Add a specific variant for ${selectedVariant?.name}` :
          'Please fill in the required information'
        }
        onSubmit={showModal.mode === 'create' ? handleCreate : handleEdit}
        enableSections={false}
        size="xl"
        fields={
          showModal.type === 'variant' ? [
            { 
              name: 'name', 
              label: 'Variant Name', 
              type: 'text', 
              required: true,
              description: 'Enter a unique name for this granite variant',
              placeholder: 'e.g., Premium Black Granite, Himalayan Blue'
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea', 
              required: false,
              description: 'Detailed description of the granite variant characteristics',
              placeholder: 'Describe the color, pattern, origin, and unique features...',
              rows: 4
            },
            { 
              name: 'image', 
              label: 'Variant Image', 
              type: 'file', 
              required: false,
              description: 'Upload a representative image of this granite variant',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
          ] : showModal.type === 'specificVariant' ? [
            { 
              name: 'name', 
              label: 'Specific Variant Name', 
              type: 'text', 
              required: true,
              description: `Enter a specific name for this ${selectedVariant?.name} variant`,
              placeholder: 'e.g., Polished, Natural Split, Bush Hammered'
            },
            { 
              name: 'description', 
              label: 'Description', 
              type: 'textarea', 
              required: false,
              description: 'Describe the specific characteristics, finish, or processing of this variant',
              placeholder: 'Describe the finish, texture, applications, and unique properties...',
              rows: 4
            },
            { 
              name: 'image', 
              label: 'Specific Variant Image', 
              type: 'file', 
              required: false,
              description: 'Upload an image showing this specific variant finish or style',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
          ] : showModal.type === 'product' ? [
            // Core identification
            { 
              name: 'name', 
              label: 'Product Name', 
              type: 'text', 
              required: true,
              description: 'Enter a clear, descriptive name for this granite product',
              placeholder: 'e.g., Premium Granite Steps 48x12x6'
            },
            { 
              name: 'category', 
              label: 'Product Category', 
              type: 'select', 
              required: true,
              description: 'Select the primary category that best describes this product',
              options: [
                { value: 'Pattern', label: 'Pattern' },
                { value: 'Fillers', label: 'Fillers' },
                { value: 'Platforms', label: 'Platforms' },
                { value: 'Slab', label: 'Slab' },
                { value: 'Steps', label: 'Steps' },
                { value: 'Treads', label: 'Treads' },
                { value: 'Pool Coping', label: 'Pool Coping' },
                { value: 'Pillar Caps', label: 'Pillar Caps' },
                { value: 'Firepit Coping', label: 'Firepit Coping' },
                { value: 'Horse Trough', label: 'Horse Trough' },
                { value: 'BH Pavers', label: 'BH Pavers' },
                { value: 'Curbs', label: 'Curbs' },
                { value: 'Posts', label: 'Posts' },
                { value: 'Other', label: 'Other' }
              ]
            },
            { 
              name: 'subcategory', 
              label: 'Subcategory (Optional)', 
              type: 'text', 
              required: false,
              description: 'Add specific details about the finish or style',
              placeholder: 'e.g., Natural Split, Bush Hammered, Thermal Finish'
            },
            
            // Dimensions & specifications
            { 
              name: 'length', 
              label: 'Length (inches)', 
              type: 'number', 
              required: true, 
              min: 0, 
              step: 0.1,
              description: 'The longest dimension of the product',
              placeholder: 'e.g., 48'
            },
            { 
              name: 'width', 
              label: 'Width (inches)', 
              type: 'number', 
              required: true, 
              min: 0, 
              step: 0.1,
              description: 'The width dimension of the product',
              placeholder: 'e.g., 36'
            },
            { 
              name: 'thickness', 
              label: 'Thickness (inches)', 
              type: 'number', 
              required: true, 
              min: 0, 
              step: 0.1,
              description: 'The depth or thickness of the product',
              placeholder: 'e.g., 6'
            },
            { 
              name: 'weight_per_piece', 
              label: 'Weight per Piece (lbs) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.1,
              description: 'Weight of a single piece in pounds'
            },
            { 
              name: 'area_per_piece', 
              label: 'Area per Piece (sq ft) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.01,
              description: 'Will be auto-calculated if left empty',
              placeholder: 'Leave empty for auto-calculation'
            },
            
            // Packaging & inventory
            { 
              name: 'pieces_per_crate', 
              label: 'Pieces per Crate', 
              type: 'number', 
              required: true, 
              min: 1,
              description: 'How many pieces come in one shipping crate',
              placeholder: 'e.g., 20'
            },
            { 
              name: 'pieces_per_set', 
              label: 'Pieces per Set (Optional)', 
              type: 'number', 
              required: false, 
              min: 1,
              description: 'For products sold in sets (leave empty if not applicable)',
              placeholder: 'For set-based products'
            },
            { 
              name: 'crate_weight', 
              label: 'Crate Weight (lbs) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.1,
              description: 'Total weight of a full crate including packaging'
            },
            { 
              name: 'stock', 
              label: 'Stock Quantity', 
              type: 'number', 
              required: true, 
              min: 0,
              description: 'Current inventory count in your chosen unit type'
            },
            { 
              name: 'unit_type', 
              label: 'Unit Type', 
              type: 'select', 
              required: true,
              description: 'How this product is measured and sold',
              options: [
                { value: 'sqft', label: 'Square Feet (sqft)' },
                { value: 'sq_m', label: 'Square Meter (sq_m)' },
                { value: 'piece', label: 'Piece' },
                { value: 'set', label: 'Set' },
                { value: 'crate', label: 'Crate' },
                { value: 'slab', label: 'Slab' }
              ]
            },
            
            // Pricing structure
            { 
              name: 'price_per_unit', 
              label: 'Price per Unit ($)', 
              type: 'number', 
              required: true, 
              min: 0, 
              step: 0.01,
              description: 'Primary selling price per unit (matches your unit type above)',
              placeholder: 'Primary pricing'
            },
            { 
              name: 'price_per_sqft', 
              label: 'Price per Sq Ft ($) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.01,
              description: 'Alternative pricing per square foot (if applicable)'
            },
            { 
              name: 'price_per_piece', 
              label: 'Price per Piece ($) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.01,
              description: 'Alternative pricing per individual piece'
            },
            { 
              name: 'price_per_set', 
              label: 'Price per Set ($) - Optional', 
              type: 'number', 
              required: false, 
              min: 0, 
              step: 0.01,
              description: 'Pricing for set-based sales (if applicable)'
            },
            { 
              name: 'currency', 
              label: 'Currency', 
              type: 'select', 
              required: true,
              description: 'Currency for all pricing',
              options: [
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'INR', label: 'INR (₹)' },
                { value: 'GBP', label: 'GBP (£)' }
              ]
            },
            
            // Product features
            { 
              name: 'finish', 
              label: 'Available Finishes', 
              type: 'multiselect', 
              required: false,
              description: 'Select all available surface finishes for this product',
              options: [
                { value: 'polished', label: 'Polished' },
                { value: 'honed', label: 'Honed' },
                { value: 'brushed', label: 'Brushed' },
                { value: 'bush_hammered', label: 'Bush Hammered' },
                { value: 'natural_split', label: 'Natural Split' },
                { value: 'flamed', label: 'Flamed' },
                { value: 'tumbled', label: 'Tumbled' },
                { value: 'sandblasted', label: 'Sandblasted' }
              ]
            },
            { 
              name: 'applications', 
              label: 'Suitable Applications', 
              type: 'multiselect', 
              required: false,
              description: 'Select all suitable uses for this product',
              options: [
                { value: 'flooring', label: 'Flooring' },
                { value: 'wall_cladding', label: 'Wall Cladding' },
                { value: 'countertops', label: 'Countertops' },
                { value: 'landscaping', label: 'Landscaping' },
                { value: 'garden_edging', label: 'Garden Edging' },
                { value: 'decorative_borders', label: 'Decorative Borders' },
                { value: 'outdoor_platforms', label: 'Outdoor Platforms' },
                { value: 'patios', label: 'Patios' },
                { value: 'decking', label: 'Decking' },
                { value: 'large_surfaces', label: 'Large Surfaces' },
                { value: 'monuments', label: 'Monuments' },
                { value: 'staircases', label: 'Staircases' },
                { value: 'landscape_steps', label: 'Landscape Steps' },
                { value: 'garden_steps', label: 'Garden Steps' },
                { value: 'stair_treads', label: 'Stair Treads' },
                { value: 'step_covers', label: 'Step Covers' },
                { value: 'landing_surfaces', label: 'Landing Surfaces' },
                { value: 'pool_edges', label: 'Pool Edges' },
                { value: 'pool_coping', label: 'Pool Coping' },
                { value: 'water_features', label: 'Water Features' },
                { value: 'column_caps', label: 'Column Caps' },
                { value: 'pillar_tops', label: 'Pillar Tops' },
                { value: 'architectural_elements', label: 'Architectural Elements' }
              ]
            },
            { 
              name: 'special_features', 
              label: 'Special Features', 
              type: 'text', 
              required: false,
              description: 'Any unique characteristics, custom work, or special features',
              placeholder: 'e.g., rounded edges, custom grinding finish, anti-slip surface'
            },
            
            // Legacy compatibility
            { 
              name: 'basePrice', 
              label: 'Base Price ($) - Legacy', 
              type: 'number', 
              required: true, 
              min: 0, 
              step: 0.01,
              description: 'This will automatically sync with price per unit above',
              placeholder: 'Will sync with price_per_unit'
            },
            { 
              name: 'unit', 
              label: 'Unit - Legacy', 
              type: 'select', 
              required: true,
              description: 'Legacy unit field - should match unit type above',
              options: [
                { value: 'sqft', label: 'Square Feet (sqft)' },
                { value: 'sq_m', label: 'Square Meter (sq_m)' },
                { value: 'piece', label: 'Piece' },
                { value: 'slab', label: 'Slab' }
              ]
            },
            
            // Media
            { 
              name: 'image1', 
              label: 'Primary Product Image', 
              type: 'file', 
              required: false,
              description: 'Main product photo - this will be the first image customers see',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
            { 
              name: 'image2', 
              label: 'Additional Image 2', 
              type: 'file', 
              required: false,
              description: 'Second product photo showing different angle or detail',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
            { 
              name: 'image3', 
              label: 'Additional Image 3', 
              type: 'file', 
              required: false,
              description: 'Third product photo for comprehensive view',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
            { 
              name: 'image4', 
              label: 'Additional Image 4', 
              type: 'file', 
              required: false,
              description: 'Fourth product photo for complete documentation',
              accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml'
            },
            
            // Status
            { 
              name: 'status', 
              label: 'Product Status', 
              type: 'select', 
              required: true,
              description: 'Current availability status of this product',
              options: [
                { value: 'active', label: 'Active - Available for sale' },
                { value: 'inactive', label: 'Inactive - Temporarily unavailable' },
                { value: 'discontinued', label: 'Discontinued - No longer produced' },
                { value: 'out_of_stock', label: 'Out of Stock - Temporarily sold out' }
              ]
            }
          ] : []
        }
        initialData={memoizedInitialData || {}}
      />

      {/* Enhanced Product Creation Form Modal */}
      {showModal.type === 'product' && (
        <ModernProductForm
          key={`${showModal.mode}-${showModal.item?._id || 'new'}`}
          isOpen={true}
          onClose={() => setShowModal({ type: null, mode: 'create' })}
          onSubmit={showModal.mode === 'create' ? handleCreate : handleEdit}
          specificVariant={selectedSpecificVariant || undefined}
          initialData={memoizedInitialData}
          mode={showModal.mode as 'create' | 'edit'}
        />
      )}

      {/* Product Details Modal */}
      <ModernProductDetails
        isOpen={detailedViewModal.isOpen && detailedViewModal.type === 'product'}
        onClose={() => setDetailedViewModal({ isOpen: false, type: 'variant', item: null })}
        onEdit={() => {
          setShowModal({ type: 'product', mode: 'edit', item: detailedViewModal.item });
          setDetailedViewModal({ isOpen: false, type: 'variant', item: null });
        }}
        product={detailedViewModal.item as GraniteProduct}
      />

      <ConfirmDialog
        isOpen={showModal.type === 'delete'}
        onClose={() => {
          setShowModal({ type: null, mode: 'create' });
          setDependencyInfo(null);
        }}
        onConfirm={handleDelete}
        title={checkingDependencies ? "Checking Dependencies..." : (dependencyInfo?.canDelete ? "Confirm Delete" : "Cannot Delete")}
        confirmText={checkingDependencies ? "Checking..." : (dependencyInfo?.canDelete ? "Delete" : "Close")}
        variant={checkingDependencies ? "info" : (dependencyInfo?.canDelete ? "danger" : "warning")}
        isLoading={checkingDependencies}
      >
        <div className="space-y-3">
          {checkingDependencies ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>Checking for dependent items...</div>
            </div>
          ) : (
            <>
              <div>
                {dependencyInfo?.canDelete 
                  ? `Are you sure you want to delete this ${showModal.item?.deleteType}? This action cannot be undone.`
                  : `This ${showModal.item?.deleteType} cannot be deleted because:`
                }
              </div>
              
              {dependencyInfo && !dependencyInfo.canDelete && (
                <div className="bg-error-lighter border border-error-light rounded-lg p-3">
                  <div className="text-error font-medium">⚠️ {dependencyInfo.message}</div>
                  {dependencyInfo.dependencies && (
                    <div className="mt-2 text-sm text-error">
                      <div className="font-medium mb-1">Dependencies found:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {dependencyInfo.dependencies.specificVariants > 0 && (
                          <li>{dependencyInfo.dependencies.specificVariants} specific variant(s)</li>
                        )}
                        {dependencyInfo.dependencies.products > 0 && (
                          <li>{dependencyInfo.dependencies.products} product(s)</li>
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-error italic">
                    💡 Delete dependent items first: Products → Specific Variants → Variants
                  </div>
                </div>
              )}
              
              {dependencyInfo?.canDelete && (
                <div className="bg-success-lighter border border-success-light rounded-lg p-3">
                  <div className="text-success font-medium">✅ Safe to delete</div>
                  <div className="text-sm text-success">No dependent items found.</div>
                </div>
              )}
            </>
          )}
        </div>
      </ConfirmDialog>

      {/* Advanced Import/Export Modal */}
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        type={importExportType}
        data={getCurrentExportData()}
        onImportComplete={handleImportComplete}
        onExportComplete={handleExportComplete}
      />

      {/* Enhanced Detailed View Modal */}
      <DetailedViewModal
        isOpen={detailedViewModal.isOpen}
        onClose={() => setDetailedViewModal({ isOpen: false, type: 'variant', item: null })}
        type={detailedViewModal.type}
        item={detailedViewModal.item}
        onEdit={(item) => {
          openEditModal(detailedViewModal.type, item);
          setDetailedViewModal({ isOpen: false, type: 'variant', item: null });
        }}
        onDelete={(item) => {
          openDeleteModal(detailedViewModal.type, item);
          setDetailedViewModal({ isOpen: false, type: 'variant', item: null });
        }}
      />
    </div>
  );
}
