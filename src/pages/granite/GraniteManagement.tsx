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
import { FormModal } from '../../components/ui/form-modal';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ImportExportModal } from '../../components/ui/import-export-modal';
import DetailedViewModal from '../../components/ui/detailed-view-modal';

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
      queryClient.invalidateQueries({ queryKey: ['specificVariants'] });
      notify('Specific variant created successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to create specific variant: ${error.message}`, 'error'),
  });

  const createProductMutation = useMutation({
    mutationFn: graniteApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
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
      queryClient.invalidateQueries({ queryKey: ['specificVariants'] });
      notify('Specific variant updated successfully!');
      setShowModal({ type: null, mode: 'create' });
    },
    onError: (error) => notify(`Failed to update specific variant: ${error.message}`, 'error'),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
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
        queryClient.invalidateQueries({ queryKey: ['specificVariants'] });
      } else if (type === 'product') {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`${type}s`] });
      }
      notify(`${type} deleted successfully!`);
      setShowModal({ type: null, mode: 'create' });
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
      
      setDependencyInfo(response.data || null);
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
      
      // Nested dimensions
      length: product.dimensions?.length || product.length || '',
      width: product.dimensions?.width || product.width || '',
      thickness: product.dimensions?.thickness || product.thickness || '',
      
      // Nested packaging
      pieces_per_crate: product.packaging?.pieces_per_crate || product.pieces_per_crate || '',
      pieces_per_set: product.packaging?.pieces_per_set || product.pieces_per_set || '',
      crate_weight: product.packaging?.crate_weight || product.crate_weight || '',
      
      // Nested pricing
      price_per_unit: product.pricing?.price_per_unit || product.price_per_unit || product.basePrice || '',
      price_per_sqft: product.pricing?.price_per_sqft || product.price_per_sqft || '',
      price_per_piece: product.pricing?.price_per_piece || product.price_per_piece || '',
      price_per_set: product.pricing?.price_per_set || product.price_per_set || '',
      currency: product.pricing?.currency || product.currency || 'USD',
      
      // Other fields
      area_per_piece: product.area_per_piece || product.calculatedAreaPerPiece || '',
      weight_per_piece: product.weight_per_piece || '',
      stock: product.stock || '',
      unit_type: product.unit_type || product.unit || 'sqft',
      
      // Arrays - handle differently based on field type
      // For multiselect fields (finish, applications), keep as arrays
      // For text fields (special_features), convert to comma-separated string
      finish: Array.isArray(product.finish) ? product.finish : (product.finish ? [product.finish] : []),
      applications: Array.isArray(product.applications) ? product.applications : (product.applications ? [product.applications] : []),
      special_features: Array.isArray(product.special_features) ? product.special_features.join(', ') : (product.special_features || ''),
      
      // Legacy compatibility
      basePrice: product.basePrice || product.pricing?.price_per_unit || product.price_per_unit || '',
      unit: product.unit || product.unit_type || 'sqft',
      
      // Images - don't include in edit form as they're handled separately
      // image1, image2, image3, image4 will be empty for editing
    };
    
    return transformed;
  };

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
        // Transform flat data back to nested structure for API
        finalData = {
          // Basic fields
          name: processedData.name,
          category: processedData.category,
          subcategory: processedData.subcategory,
          status: processedData.status,
          
          // Nested dimensions
          dimensions: {
            length: processedData.length,
            width: processedData.width,
            thickness: processedData.thickness,
            unit: 'inches'
          },
          
          // Nested packaging
          packaging: {
            pieces_per_crate: processedData.pieces_per_crate,
            ...(processedData.pieces_per_set && { pieces_per_set: processedData.pieces_per_set }),
            ...(processedData.crate_weight && { crate_weight: processedData.crate_weight })
          },
          
          // Nested pricing
          pricing: {
            price_per_unit: processedData.price_per_unit,
            currency: processedData.currency,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading granite management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🧱 Granite Management</h1>
            <p className="text-gray-600 mt-1">Manage your granite variants, specific variants, and products</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowImportExportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import/Export
            </Button>
          </div>
        </div>
      </div>

      {/* Simple Navigation Breadcrumb */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant={!selectedVariant ? "default" : "ghost"}
                size="lg"
                onClick={() => {
                  setSelectedVariant(null);
                  setSelectedSpecificVariant(null);
                }}
                className={`${!selectedVariant ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-100'} transition-all`}
              >
                🧱 Granite Variants
                {!selectedVariant && <Badge className="ml-2 bg-white text-blue-600">{variantsArray.length}</Badge>}
              </Button>
              
              {selectedVariant && (
                <>
                  <span className="text-2xl text-gray-300">→</span>
                  <Button 
                    variant={!selectedSpecificVariant ? "default" : "ghost"}
                    size="lg"
                    onClick={() => setSelectedSpecificVariant(null)}
                    className={`${!selectedSpecificVariant ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-100'} transition-all`}
                  >
                    💎 {selectedVariant.name} Variants
                    {!selectedSpecificVariant && <Badge className="ml-2 bg-white text-purple-600">{specificVariantsArray.length}</Badge>}
                  </Button>
                </>
              )}
              
              {selectedSpecificVariant && (
                <>
                  <span className="text-2xl text-gray-300">→</span>
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium">
                    📦 {selectedSpecificVariant.name} Products
                    <Badge className="ml-2 bg-white text-green-600">{productsArray.length}</Badge>
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportExportModal(true)}>
                <Upload className="h-4 w-4 mr-1" />
                Import/Export
              </Button>
              {selectedVariant && !selectedSpecificVariant && (
                <Button size="sm" onClick={() => openCreateModal('specificVariant')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Specific Variant
                </Button>
              )}
              {selectedSpecificVariant && (
                <Button size="sm" onClick={() => openCreateModal('product')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              )}
              {!selectedVariant && (
                <Button size="sm" onClick={() => openCreateModal('variant')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area - Simple Hierarchical View */}
      {!selectedVariant ? (
        /* LEVEL 1: GRANITE VARIANTS VIEW */
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{variantsArray.length}</div>
                <div className="text-sm text-blue-700">🧱 Base Variants</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{allSpecificVariantsData?.data?.length || specificVariantsData?.data?.length || 0}</div>
                <div className="text-sm text-purple-700">💎 Specific Variants</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{allProductsData?.data?.length || productsData?.data?.length || 0}</div>
                <div className="text-sm text-green-700">📦 Total Products</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">₹{analytics.totalValue?.toLocaleString() || '0'}</div>
                <div className="text-sm text-orange-700">💰 Total Value</div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="🔍 Search granite variants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Granite Variants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredVariants.map((variant: GraniteVariant) => (
              <Card 
                key={variant._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-2 hover:border-blue-300"
                onClick={() => setSelectedVariant(variant)}
              >
                {/* Enhanced Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-lg">
                  <img
                    src={variant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIj7wn6e1IEdyYW5pdGUgVmFyaWFudDwvdGV4dD4KPHN2Zz4K'}
                    alt={variant.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNmI3MjgwIj7wn6e1IEdyYW5pdGUgVmFyaWFudDwvdGV4dD4KPHN2Zz4K';
                    }}
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white text-center">
                        <div className="text-sm font-medium">Click to explore</div>
                        <div className="text-xs text-gray-200">View specific variants & products</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal('variant', variant);
                        }}
                      >
                        <Edit className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal('variant', variant);
                        }}
                        disabled={checkingDependencies}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Stats Badge */}
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {(allSpecificVariantsData?.data || specificVariantsData?.data || []).filter(sv => sv.variantId === variant._id).length} variants
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        🧱 {variant.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {variant.description || 'Premium granite variant with excellent quality and durability'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(variant.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        ✅ Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Variant Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gradient-to-br from-gray-50 to-blue-50"
              onClick={() => openCreateModal('variant')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
                <h3 className="font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  Add New Granite Variant
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Create a new base granite variant
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !selectedSpecificVariant ? (
        /* LEVEL 2: SPECIFIC VARIANTS VIEW */
        <div className="space-y-6">
          {/* Variant Header */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedVariant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzZiNzI4MCI+8J+ntTwvdGV4dD4KPHN2Zz4K'}
                    alt={selectedVariant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">🧱 {selectedVariant.name}</h2>
                    <p className="text-gray-600">{selectedVariant.description || 'Base granite variant'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{specificVariantsArray.length}</div>
                  <div className="text-sm text-purple-700">Specific Variants</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="🔍 Search specific variants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Specific Variants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredSpecificVariants.map((specificVariant: SpecificGraniteVariant) => (
              <Card 
                key={specificVariant._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-2 hover:border-purple-300"
                onClick={() => setSelectedSpecificVariant(specificVariant)}
              >
                {/* Enhanced Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden rounded-t-lg">
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
                        <div className="text-xs text-gray-200">View products for this variant</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal('specificVariant', specificVariant);
                        }}
                      >
                        <Edit className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500"
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

                  {/* Product Count Badge */}
                  <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {(allProductsData?.data || productsData?.data || []).filter(p => p.variantSpecificId === specificVariant._id).length} products
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                        💎 {specificVariant.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {specificVariant.description || 'Premium specific variant with enhanced characteristics'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(specificVariant.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        ⭐ Premium
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Specific Variant Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gradient-to-br from-gray-50 to-purple-50"
              onClick={() => openCreateModal('specificVariant')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-gray-400 group-hover:text-purple-500 transition-colors mb-4" />
                <h3 className="font-medium text-gray-600 group-hover:text-purple-600 transition-colors">
                  Add New Specific Variant
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Create a specific variant for {selectedVariant.name}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* LEVEL 3: PRODUCTS VIEW */
        <div className="space-y-6">
          {/* Product Header */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedSpecificVariant.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjNlOGZmIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzkzMzNlYSI+8J+SjjwvdGV4dD4KPHN2Zz4K'}
                    alt={selectedSpecificVariant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">📦 {selectedSpecificVariant.name} Products</h2>
                    <p className="text-gray-600">Products for {selectedVariant.name} → {selectedSpecificVariant.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{productsArray.length}</div>
                  <div className="text-sm text-green-700">Products Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="🔍 Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">📝 Name</SelectItem>
                      <SelectItem value="price">💰 Price</SelectItem>
                      <SelectItem value="stock">📦 Stock</SelectItem>
                      <SelectItem value="createdAt">📅 Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {getFilteredProducts.map((product: GraniteProduct) => (
              <Card 
                key={product._id} 
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-2 hover:border-green-300"
                onClick={() => setDetailedViewModal({
                  isOpen: true,
                  type: 'product',
                  item: product
                })}
              >
                {/* Enhanced Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden rounded-t-lg">
                  <img
                    src={(product.images && product.images.length > 0 ? product.images[0] : '') || 
                         'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZGNmY2U3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMTZhMzRhIj7wn5OmIFByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo='}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZGNmY2U3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMTZhMzRhIj7wn5OmIFByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  
                  {/* Stock Status Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                    (product.stock || 0) <= 0 ? 'bg-red-500 text-white' :
                    (product.stock || 0) <= 10 ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {(product.stock || 0) <= 0 ? '❌ Out of Stock' :
                     (product.stock || 0) <= 10 ? '⚠️ Low Stock' :
                     `✅ ${product.stock} in stock`}
                  </div>

                  {/* Multiple Images Indicator */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      🖼️ {product.images.length} photos
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute bottom-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ₹{product.basePrice?.toLocaleString() || 'N/A'}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 right-4">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailedViewModal({
                            isOpen: true,
                            type: 'product',
                            item: product
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors">
                        📦 {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        📏 {product.unit || 'sq_ft'} • 
                        {product.finish && product.finish.length > 0 ? ` ${product.finish.length} finishes` : ' Standard finish'}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        📦 {product.stock || 0} units
                      </Badge>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'} 
                             className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                        {product.status === 'active' ? '✅' : '⏸️'} {product.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal('product', product);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal('product', product);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Product Card */}
            <Card 
              className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 border-2 border-dashed border-gray-300 hover:border-green-400 bg-gradient-to-br from-gray-50 to-green-50"
              onClick={() => openCreateModal('product')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-gray-400 group-hover:text-green-500 transition-colors mb-4" />
                <h3 className="font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                  Add New Product
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Create a product for {selectedSpecificVariant.name}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modals and Other Components */}
      <FormModal
        isOpen={showModal.type !== null && showModal.type !== 'delete'}
        onClose={() => setShowModal({ type: null, mode: 'create' })}
        title={showModal.mode === 'create' ? `Add New ${showModal.type}` : `Edit ${showModal.type}`}
        onSubmit={showModal.mode === 'create' ? handleCreate : handleEdit}
        fields={
          showModal.type === 'variant' ? [
            { name: 'name', label: 'Variant Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'image', label: 'Variant Image', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
          ] : showModal.type === 'specificVariant' ? [
            { name: 'name', label: 'Specific Variant Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'image', label: 'Specific Variant Image', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
          ] : showModal.type === 'product' ? [
            // Core identification
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'category', label: 'Product Category', type: 'select', required: true, options: [
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
            ]},
            { name: 'subcategory', label: 'Subcategory (Optional)', type: 'text', required: false, placeholder: 'e.g., Natural Split, Bush Hammered' },
            
            // Dimensions & specifications
            { name: 'length', label: 'Length (inches)', type: 'number', required: true, min: 0, step: 0.1, placeholder: 'e.g., 48' },
            { name: 'width', label: 'Width (inches)', type: 'number', required: true, min: 0, step: 0.1, placeholder: 'e.g., 36' },
            { name: 'thickness', label: 'Thickness (inches)', type: 'number', required: true, min: 0, step: 0.1, placeholder: 'e.g., 6' },
            { name: 'weight_per_piece', label: 'Weight per Piece (kg) - Optional', type: 'number', required: false, min: 0, step: 0.1 },
            { name: 'area_per_piece', label: 'Area per Piece (sq ft) - Optional', type: 'number', required: false, min: 0, step: 0.01, placeholder: 'Leave empty for auto-calculation' },
            
            // Packaging & inventory
            { name: 'pieces_per_crate', label: 'Pieces per Crate', type: 'number', required: true, min: 1, placeholder: 'e.g., 20' },
            { name: 'pieces_per_set', label: 'Pieces per Set (Optional)', type: 'number', required: false, min: 1, placeholder: 'For set-based products' },
            { name: 'crate_weight', label: 'Crate Weight (kg) - Optional', type: 'number', required: false, min: 0, step: 0.1 },
            { name: 'stock', label: 'Stock Quantity', type: 'number', required: true, min: 0 },
            { name: 'unit_type', label: 'Unit Type', type: 'select', required: true, options: [
              { value: 'sqft', label: 'Square Feet (sqft)' },
              { value: 'sq_m', label: 'Square Meter (sq_m)' },
              { value: 'piece', label: 'Piece' },
              { value: 'set', label: 'Set' },
              { value: 'crate', label: 'Crate' },
              { value: 'slab', label: 'Slab' }
            ]},
            
            // Pricing structure
            { name: 'price_per_unit', label: 'Price per Unit ($)', type: 'number', required: true, min: 0, step: 0.01, placeholder: 'Primary pricing' },
            { name: 'price_per_sqft', label: 'Price per Sq Ft ($) - Optional', type: 'number', required: false, min: 0, step: 0.01 },
            { name: 'price_per_piece', label: 'Price per Piece ($) - Optional', type: 'number', required: false, min: 0, step: 0.01 },
            { name: 'price_per_set', label: 'Price per Set ($) - Optional', type: 'number', required: false, min: 0, step: 0.01 },
            { name: 'currency', label: 'Currency', type: 'select', required: true, options: [
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'INR', label: 'INR (₹)' },
              { value: 'GBP', label: 'GBP (£)' }
            ]},
            
            // Product features
            { name: 'finish', label: 'Available Finishes', type: 'multiselect', required: false, options: [
              { value: 'polished', label: 'Polished' },
              { value: 'honed', label: 'Honed' },
              { value: 'brushed', label: 'Brushed' },
              { value: 'bush_hammered', label: 'Bush Hammered' },
              { value: 'natural_split', label: 'Natural Split' },
              { value: 'flamed', label: 'Flamed' },
              { value: 'tumbled', label: 'Tumbled' },
              { value: 'sandblasted', label: 'Sandblasted' }
            ]},
            { name: 'applications', label: 'Applications', type: 'multiselect', required: false, options: [
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
            ]},
            { name: 'special_features', label: 'Special Features (comma separated)', type: 'text', required: false, placeholder: 'e.g., rounded edges, custom grinding finish' },
            
            // Legacy compatibility
            { name: 'basePrice', label: 'Base Price ($) - Legacy', type: 'number', required: true, min: 0, step: 0.01, placeholder: 'Will sync with price_per_unit' },
            { name: 'unit', label: 'Unit - Legacy', type: 'select', required: true, options: [
              { value: 'sqft', label: 'Square Feet (sqft)' },
              { value: 'sq_m', label: 'Square Meter (sq_m)' },
              { value: 'piece', label: 'Piece' },
              { value: 'slab', label: 'Slab' }
            ]},
            
            // Media
            { name: 'image1', label: 'Product Image 1', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
            { name: 'image2', label: 'Product Image 2 (optional)', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
            { name: 'image3', label: 'Product Image 3 (optional)', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
            { name: 'image4', label: 'Product Image 4 (optional)', type: 'file', required: false, accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml' },
            
            // Status
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'discontinued', label: 'Discontinued' },
              { value: 'out_of_stock', label: 'Out of Stock' }
            ]}
          ] : []
        }
        initialData={
          showModal.mode === 'edit' && showModal.item ? (
            showModal.type === 'product' ? transformProductForEdit(showModal.item) : showModal.item
          ) : {}
        }
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 font-medium">⚠️ {dependencyInfo.message}</div>
                  {dependencyInfo.dependencies && (
                    <div className="mt-2 text-sm text-red-700">
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
                  <div className="mt-2 text-sm text-red-600 italic">
                    💡 Delete dependent items first: Products → Specific Variants → Variants
                  </div>
                </div>
              )}
              
              {dependencyInfo?.canDelete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 font-medium">✅ Safe to delete</div>
                  <div className="text-sm text-green-700">No dependent items found.</div>
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
      />
    </div>
  );
}
