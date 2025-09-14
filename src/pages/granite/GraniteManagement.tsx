import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, Upload, Download, 
  Package, Layers, ShoppingCart, TrendingUp,
  Star, Settings, Filter, SortAsc, SortDesc,
  Grid, List, AlertTriangle, DollarSign,
  BarChart3, PieChart, Activity, CheckCircle,
  Zap, Target, Database, Eye, Image, 
  Maximize2
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { graniteApi } from '../../services/graniteApi';
import type { GraniteVariant, SpecificGraniteVariant, GraniteProduct } from '../../types';
import { FormModal } from '../../components/ui/form-modal';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ImportExportModal } from '../../components/ui/import-export-modal';
import { uploadImage } from '../../services/uploadService';
import DetailedViewModal from '../../components/ui/detailed-view-modal';

export function GraniteManagement() {
  // Simplified Navigation State
  const [currentView, setCurrentView] = useState<'variants' | 'specificVariants' | 'products'>('variants');
  const [selectedVariant, setSelectedVariant] = useState<GraniteVariant | null>(null);
  const [selectedSpecificVariant, setSelectedSpecificVariant] = useState<SpecificGraniteVariant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Navigation helpers
  const handleVariantClick = (variant: GraniteVariant) => {
    setSelectedVariant(variant);
    setSelectedSpecificVariant(null);
    setCurrentView('specificVariants');
  };

  const handleSpecificVariantClick = (specificVariant: SpecificGraniteVariant) => {
    setSelectedSpecificVariant(specificVariant);
    setCurrentView('products');
  };

  const handleBackToVariants = () => {
    setSelectedVariant(null);
    setSelectedSpecificVariant(null);
    setCurrentView('variants');
  };

  const handleBackToSpecificVariants = () => {
    setSelectedSpecificVariant(null);
    setCurrentView('specificVariants');
  };

  // Breadcrumb navigation
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { 
        label: '🧱 Granite Variants', 
        onClick: handleBackToVariants,
        active: currentView === 'variants'
      }
    ];

    if (selectedVariant) {
      breadcrumbs.push({
        label: `💎 ${selectedVariant.name}`,
        onClick: handleBackToSpecificVariants,
        active: currentView === 'specificVariants'
      });
    }

    if (selectedSpecificVariant) {
      breadcrumbs.push({
        label: `📦 ${selectedSpecificVariant.name}`,
        onClick: () => {},
        active: currentView === 'products'
      });
    }

    return breadcrumbs;
  };

  // Advanced filtering and sorting
  const [filters, setFilters] = useState({
    status: 'all', // all, active, inactive, out_of_stock
    priceRange: 'all', // all, under-1000, 1000-5000, 5000-10000, above-10000
    stockLevel: 'all', // all, in-stock, low-stock, out-of-stock
    category: 'all', // all, premium, standard, budget
    sortBy: 'name', // name, price, stock, created, updated
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Advanced features
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Import/Export modal state
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportType, setImportExportType] = useState<'variants' | 'specificVariants' | 'products' | 'hierarchy'>('variants');

  // Detailed view modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalData, setDetailModalData] = useState<{
    type: 'variant' | 'specificVariant' | 'product';
    item: any;
  } | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState<{
    type: 'variant' | 'specificVariant' | 'product' | 'delete' | 'bulkEdit' | 'analytics' | null;
    mode: 'create' | 'edit' | 'delete' | 'bulk';
    item?: any;
  }>({ type: null, mode: 'create' });

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

  // Bulk selection handlers
  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(productsArray.map(p => p._id)));
    } else {
      setSelectedItems(new Set());
    }
    setSelectAll(checked);
  };

  // API Queries
  const { data: variantsResponse, isLoading: variantsLoading } = useQuery({
    queryKey: ['granite-variants'],
    queryFn: graniteApi.getVariants,
  });

  const { data: specificVariantsResponse, isLoading: specificVariantsLoading } = useQuery({
    queryKey: ['specific-granite-variants', selectedVariant?._id],
    queryFn: () => graniteApi.getSpecificVariantsByVariant(selectedVariant!._id),
    enabled: !!selectedVariant?._id,
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['granite-products', selectedSpecificVariant?._id],
    queryFn: () => graniteApi.getProductsBySpecificVariant(selectedSpecificVariant!._id),
    enabled: !!selectedSpecificVariant?._id,
  });

  // Mutations
  const createVariantMutation = useMutation({
    mutationFn: (data: any) => graniteApi.createVariant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Variant created successfully!');
    },
    onError: () => notify('❌ Failed to create variant', 'error')
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Variant updated successfully!');
    },
    onError: () => notify('❌ Failed to update variant', 'error')
  });

  const deleteVariantMutation = useMutation({
    mutationFn: graniteApi.deleteVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
      setSelectedVariant(null);
      setSelectedSpecificVariant(null);
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Variant deleted successfully!');
    },
    onError: () => notify('❌ Failed to delete variant', 'error')
  });

  const createSpecificVariantMutation = useMutation({
    mutationFn: (data: any) => graniteApi.createSpecificVariant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specific-granite-variants'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Specific variant created successfully!');
    },
    onError: () => notify('❌ Failed to create specific variant', 'error')
  });

  const updateSpecificVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateSpecificVariant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specific-granite-variants'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Specific variant updated successfully!');
    },
    onError: () => notify('❌ Failed to update specific variant', 'error')
  });

  const deleteSpecificVariantMutation = useMutation({
    mutationFn: graniteApi.deleteSpecificVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specific-granite-variants'] });
      setSelectedSpecificVariant(null);
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Specific variant deleted successfully!');
    },
    onError: () => notify('❌ Failed to delete specific variant', 'error')
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => graniteApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-products'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Product created successfully!');
    },
    onError: () => notify('❌ Failed to create product', 'error')
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graniteApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-products'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Product updated successfully!');
    },
    onError: () => notify('❌ Failed to update product', 'error')
  });

  const deleteProductMutation = useMutation({
    mutationFn: graniteApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['granite-products'] });
      setShowModal({ type: null, mode: 'create' });
      notify('✅ Product deleted successfully!');
    },
    onError: () => notify('❌ Failed to delete product', 'error')
  });

  // Data processing
  const variants = variantsResponse?.data || [];
  const specificVariants = specificVariantsResponse?.data || [];
  const products = productsResponse?.data || [];

  const variantsArray = Array.isArray(variants) ? variants : [];
  const specificVariantsArray = Array.isArray(specificVariants) ? specificVariants : [];
  const productsArray = Array.isArray(products) ? products : [];

  const filteredVariants = variantsArray.filter((variant: GraniteVariant) =>
    variant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Advanced filtering function
  const getFilteredAndSortedProducts = useMemo(() => {
    let filtered = [...productsArray];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(product => {
        switch (filters.status) {
          case 'active': return product.status === 'active';
          case 'inactive': return product.status === 'inactive';
          case 'out_of_stock': return product.status === 'out_of_stock' || product.stock <= 0;
          default: return true;
        }
      });
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.basePrice || 0;
        switch (filters.priceRange) {
          case 'under-1000': return price < 1000;
          case '1000-5000': return price >= 1000 && price < 5000;
          case '5000-10000': return price >= 5000 && price < 10000;
          case 'above-10000': return price >= 10000;
          default: return true;
        }
      });
    }

    // Apply stock level filter
    if (filters.stockLevel !== 'all') {
      filtered = filtered.filter(product => {
        const stock = product.stock || 0;
        switch (filters.stockLevel) {
          case 'in-stock': return stock > 10;
          case 'low-stock': return stock > 0 && stock <= 10;
          case 'out-of-stock': return stock <= 0;
          default: return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.finish && product.finish.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.basePrice || 0;
          bValue = b.basePrice || 0;
          break;
        case 'stock':
          aValue = a.stock || 0;
          bValue = b.stock || 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    });

    return filtered;
  }, [productsArray, filters, searchTerm]);

  // Enhanced analytics
  const analytics = useMemo(() => {
    const totalProducts = productsArray.length;
    const activeProducts = productsArray.filter(p => p.status === 'active').length;
    const inStockProducts = productsArray.filter(p => (p.stock || 0) > 0).length;
    const lowStockProducts = productsArray.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
    const totalValue = productsArray.reduce((acc, p) => acc + (p.basePrice || 0) * (p.stock || 0), 0);
    const avgPrice = totalProducts > 0 ? productsArray.reduce((acc, p) => acc + (p.basePrice || 0), 0) / totalProducts : 0;
    
    return {
      totalProducts,
      activeProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts: totalProducts - inStockProducts,
      totalValue,
      avgPrice,
      profitMargin: 25, // Sample data
      conversionRate: 3.2, // Sample data
    };
  }, [productsArray]);

  // Modal handlers
  const openCreateModal = (type: 'variant' | 'specificVariant' | 'product') => {
    setShowModal({ type, mode: 'create' });
  };

  const openEditModal = (type: 'variant' | 'specificVariant' | 'product', item: any) => {
    setShowModal({ type, mode: 'edit', item });
  };

  const openDeleteModal = (type: 'variant' | 'specificVariant' | 'product', item: any) => {
    setShowModal({ type, mode: 'delete', item });
  };

  const handleSave = async (data: Record<string, any>) => {
    const { type, mode, item } = showModal;
    
    if (!data.name?.trim()) {
      notify('❌ Name is required', 'error');
      return;
    }

    try {
      // Handle image upload if there's a file
      let imageUrl = data.image;
      if (data.image instanceof File) {
        try {
          const uploadResponse = await uploadImage(data.image);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.url;
          } else {
            throw new Error('Upload failed');
          }
        } catch (uploadError: any) {
          notify(`❌ Image upload failed: ${uploadError.message}`, 'error');
          return;
        }
      }

      // Prepare the data with the uploaded image URL
      const saveData = {
        ...data,
        image: imageUrl
      };

      if (type === 'variant') {
        if (mode === 'create') {
          createVariantMutation.mutate(saveData);
        } else {
          updateVariantMutation.mutate({ id: item._id, data: saveData });
        }
      } else if (type === 'specificVariant') {
        if (mode === 'create') {
          createSpecificVariantMutation.mutate(saveData);
        } else {
          updateSpecificVariantMutation.mutate({ id: item._id, data: saveData });
        }
      } else if (type === 'product') {
        if (mode === 'create') {
          createProductMutation.mutate(saveData);
        } else {
          updateProductMutation.mutate({ id: item._id, data: saveData });
        }
      }
    } catch (error: any) {
      notify(`❌ Failed to save: ${error.message}`, 'error');
    }
  };

  const handleDelete = () => {
    const { type, item } = showModal;
    
    if (type === 'variant') {
      deleteVariantMutation.mutate(item._id);
    } else if (type === 'specificVariant') {
      deleteSpecificVariantMutation.mutate(item._id);
    } else if (type === 'product') {
      deleteProductMutation.mutate(item._id);
    }
  };

  // Detailed view handlers
  const openDetailView = (type: 'variant' | 'specificVariant' | 'product', item: any) => {
    setDetailModalData({ type, item });
    setShowDetailModal(true);
  };

  const closeDetailView = () => {
    setShowDetailModal(false);
    setDetailModalData(null);
  };

  // Import/Export handlers
  const handleOpenImportExport = (type: 'variants' | 'specificVariants' | 'products' | 'hierarchy') => {
    setImportExportType(type);
    setShowImportExportModal(true);
  };

  const handleImportComplete = (results: any) => {
    notify(`✅ Import completed! ${results.successful}/${results.total} records imported successfully.`);
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['granite-variants'] });
    queryClient.invalidateQueries({ queryKey: ['specific-granite-variants'] });
    queryClient.invalidateQueries({ queryKey: ['granite-products'] });
  };

  const handleExportComplete = (filename: string) => {
    notify(`✅ Export completed! File downloaded: ${filename}`);
  };

  // Get current data for export based on type
  const getCurrentExportData = () => {
    switch (importExportType) {
      case 'variants':
        return variantsArray;
      case 'specificVariants':
        return specificVariantsArray;
      case 'products':
        return productsArray;
      case 'hierarchy':
        // For hierarchy, we'll create a combined view
        return [];
      default:
        return [];
    }
  };

  const isLoading = 
    createVariantMutation.isPending || updateVariantMutation.isPending || deleteVariantMutation.isPending ||
    createSpecificVariantMutation.isPending || updateSpecificVariantMutation.isPending || deleteSpecificVariantMutation.isPending ||
    createProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending;

  // Form field definitions
  const variantFormFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text' as const,
      placeholder: 'e.g., Black Galaxy',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Describe the granite variant...',
      rows: 3
    },
    {
      name: 'image',
      label: '🖼️ Image',
      type: 'file' as const,
      accept: 'image/jpeg,image/png,image/webp,image/gif',
      maxSize: 5
    }
  ];

  const specificVariantFormFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text' as const,
      placeholder: 'e.g., Premium Grade',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Describe the specific variant...',
      rows: 3
    },
    {
      name: 'image',
      label: '🖼️ Image',
      type: 'file' as const,
      accept: 'image/jpeg,image/png,image/webp,image/gif',
      maxSize: 5
    }
  ];

  const productFormFields = [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text' as const,
      placeholder: 'e.g., Black Galaxy Premium Slab',
      required: true
    },
    {
      name: 'basePrice',
      label: 'Base Price (₹)',
      type: 'number' as const,
      placeholder: '0',
      min: 0,
      step: 0.01,
      required: true
    },
    {
      name: 'stock',
      label: 'Stock Quantity',
      type: 'number' as const,
      placeholder: '0',
      min: 0,
      required: true
    },
    {
      name: 'unit',
      label: 'Unit',
      type: 'select' as const,
      options: [
        { value: 'sq_ft', label: 'Square Feet' },
        { value: 'sq_m', label: 'Square Meter' },
        { value: 'piece', label: 'Per Piece' },
        { value: 'slab', label: 'Per Slab' }
      ],
      required: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏗️ Advanced Granite Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                ⚡ Enterprise-grade inventory with advanced analytics & bulk operations
              </p>
              {/* Quick Stats */}
              <div className="flex items-center space-x-6 mt-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">{analytics.activeProducts}</span>
                  <span className="text-gray-500 ml-1">Active</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="font-medium">{analytics.lowStockProducts}</span>
                  <span className="text-gray-500 ml-1">Low Stock</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium">{analytics.outOfStockProducts}</span>
                  <span className="text-gray-500 ml-1">Out of Stock</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                  <span className="font-medium text-green-600">₹{analytics.totalValue.toLocaleString()}</span>
                  <span className="text-gray-500 ml-1">Total Value</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Bulk Actions */}
              {selectedItems.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border">
                  <Badge variant="secondary">
                    {selectedItems.size} Selected
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowBulkActions(!showBulkActions)}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Bulk Actions
                  </Button>
                </div>
              )}
              
              {/* Analytics Toggle */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowModal({ type: 'analytics', mode: 'create' })}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>

              {/* Hierarchy Import/Export */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenImportExport('hierarchy')}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
              >
                <Database className="h-4 w-4 mr-2" />
                Bulk Hierarchy
              </Button>
              
              {/* Advanced Filters Toggle */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenImportExport('variants')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenImportExport('variants')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => openCreateModal('variant')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
        {/* Advanced Search & Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Main Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="🔍 Search products, variants, finishes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Sort & View Controls */}
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="updated">Updated</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                    }))}
                  >
                    {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Range</label>
                    <Select
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under-1000">Under ₹1,000</SelectItem>
                        <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
                        <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
                        <SelectItem value="above-10000">Above ₹10,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Stock Level</label>
                    <Select
                      value={filters.stockLevel}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, stockLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock</SelectItem>
                        <SelectItem value="in-stock">In Stock (&gt;10)</SelectItem>
                        <SelectItem value="low-stock">Low Stock (1-10)</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock (0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Actions</label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({
                          status: 'all',
                          priceRange: 'all',
                          stockLevel: 'all',
                          category: 'all',
                          sortBy: 'name',
                          sortOrder: 'asc',
                        })}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb */}
        {(selectedVariant || selectedSpecificVariant) && (
          <Card className="mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center space-x-2 text-sm">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedVariant(null);
                    setSelectedSpecificVariant(null);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  🏠 All Granite Variants
                </Button>
                {selectedVariant && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedSpecificVariant(null)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      🧱 {selectedVariant.name}
                    </Button>
                  </>
                )}
                {selectedSpecificVariant && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-900">
                      💎 {selectedSpecificVariant.name}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="variants">🧱 Base Variants</TabsTrigger>
            <TabsTrigger value="specific">💎 Specific Variants</TabsTrigger>
            <TabsTrigger value="products">📦 Products</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Total Products</CardDescription>
                    <Package className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{analytics.totalProducts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-green-600">📦 Total inventory</div>
                    <Badge variant="secondary">{analytics.activeProducts} Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Inventory Value</CardDescription>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    ₹{analytics.totalValue.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-green-600">� Total worth</div>
                    <div className="text-xs text-gray-500">
                      Avg: ₹{Math.round(analytics.avgPrice).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Stock Status</CardDescription>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{analytics.inStockProducts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">In Stock: {analytics.inStockProducts}</span>
                      <span className="text-red-600">Out: {analytics.outOfStockProducts}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(analytics.inStockProducts / analytics.totalProducts) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Performance</CardDescription>
                    <Target className="h-4 w-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{analytics.profitMargin}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-green-600">💹 Profit margin</div>
                    <div className="text-xs text-blue-600">
                      {analytics.conversionRate}% conversion
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stock Distribution Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    📊 Stock Distribution Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.inStockProducts}</div>
                        <div className="text-sm text-green-700">✅ In Stock</div>
                        <div className="text-xs text-gray-500">
                          {((analytics.inStockProducts / analytics.totalProducts) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.lowStockProducts}</div>
                        <div className="text-sm text-yellow-700">⚠️ Low Stock</div>
                        <div className="text-xs text-gray-500">
                          {((analytics.lowStockProducts / analytics.totalProducts) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{analytics.outOfStockProducts}</div>
                        <div className="text-sm text-red-700">❌ Out of Stock</div>
                        <div className="text-xs text-gray-500">
                          {((analytics.outOfStockProducts / analytics.totalProducts) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Stock Level Indicators */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Healthy Stock Level</span>
                        <span className="text-sm text-green-600">85%+ target</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${
                            (analytics.inStockProducts / analytics.totalProducts) * 100 >= 85 
                              ? 'bg-green-500' 
                              : (analytics.inStockProducts / analytics.totalProducts) * 100 >= 70 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${(analytics.inStockProducts / analytics.totalProducts) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    🔍 Quick Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Best Performers</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {variantsArray.length} base variants generating ₹{analytics.totalValue.toLocaleString()} value
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Attention Needed</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {analytics.lowStockProducts + analytics.outOfStockProducts} products need restocking
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Growth Potential</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {analytics.profitMargin}% margin with {analytics.conversionRate}% conversion rate
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setShowModal({ type: 'analytics', mode: 'create' })}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Detailed Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  ⚡ Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => openCreateModal('variant')}
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">🧱 Add Base Variant</div>
                        <div className="text-sm text-gray-500">Create new granite type</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    disabled={!selectedVariant}
                    onClick={() => openCreateModal('specificVariant')}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">💎 Add Specific Variant</div>
                        <div className="text-sm text-gray-500">Create quality grade</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    disabled={!selectedSpecificVariant}
                    onClick={() => openCreateModal('product')}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">📦 Add Product</div>
                        <div className="text-sm text-gray-500">Create sellable item</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Base Variants Tab */}
          <TabsContent value="variants" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">🧱 Base Granite Variants</h3>
                <p className="text-sm text-gray-500">
                  {variantsArray.length} base variant{variantsArray.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenImportExport('variants')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Variants
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenImportExport('variants')}
                  disabled={variantsArray.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export ({variantsArray.length})
                </Button>
                <Button size="sm" onClick={() => openCreateModal('variant')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Base Variant
                </Button>
              </div>
            </div>

            {variantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredVariants.map((variant: GraniteVariant) => (
                  <Card 
                    key={variant._id} 
                    className={`cursor-pointer transition-all hover:shadow-xl group ${
                      selectedVariant?._id === variant._id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedSpecificVariant(null);
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      {variant.image ? (
                        <img 
                          src={variant.image} 
                          alt={variant.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Image className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Image Overlay with Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailView('variant', variant);
                          }}
                          className="backdrop-blur-sm bg-white/90 hover:bg-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>

                      {/* Selection Indicator */}
                      {selectedVariant?._id === variant._id && (
                        <div className="absolute top-3 left-3">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            🧱 {variant.name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {variant.description || 'Premium granite variant with excellent quality and finish'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal('variant', variant);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal('variant', variant);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          🧱 Base Variant
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✅ Active
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          📅 Created: {new Date(variant.createdAt).toLocaleDateString()}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailView('variant', variant);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredVariants.length === 0 && !variantsLoading && (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">🚫 No variants found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No variants match "${searchTerm}"` : 'No granite variants available'}
                </p>
                <Button onClick={() => openCreateModal('variant')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Variant
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Specific Variants Tab */}
          <TabsContent value="specific" className="space-y-6">
            {!selectedVariant ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🚫 No Base Variant Selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Please select a base variant first to view its specific variants
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      💎 Specific Variants for {selectedVariant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {specificVariantsArray.length} specific variant{specificVariantsArray.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenImportExport('specificVariants')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Specific
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenImportExport('specificVariants')}
                      disabled={specificVariantsArray.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export ({specificVariantsArray.length})
                    </Button>
                    <Button size="sm" onClick={() => openCreateModal('specificVariant')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Specific Variant
                    </Button>
                  </div>
                </div>

                {specificVariantsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="pt-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : specificVariantsArray.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-4">
                      🚫 No specific variants found for {selectedVariant.name}
                    </p>
                    <Button size="sm" onClick={() => openCreateModal('specificVariant')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Specific Variant
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {specificVariantsArray.map((specificVariant: SpecificGraniteVariant) => (
                      <Card 
                        key={specificVariant._id} 
                        className={`group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                          selectedSpecificVariant?._id === specificVariant._id ? 'ring-2 ring-green-500 shadow-lg' : ''
                        }`}
                        onClick={() => setSelectedSpecificVariant(specificVariant)}
                      >
                        {/* Enhanced Image Section */}
                        <div className="relative aspect-video bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
                          <img
                            src={specificVariant.image || 'https://via.placeholder.com/400x240/f3e8ff/9333ea?text=✨+Specific+Variant'}
                            alt={specificVariant.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x240/f3e8ff/9333ea?text=✨+Specific+Variant';
                            }}
                          />
                          
                          {/* Selection Indicator */}
                          {selectedSpecificVariant?._id === specificVariant._id && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                className="flex-1 bg-white/90 hover:bg-white text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailedViewModal({
                                    isOpen: true,
                                    type: 'specificVariant',
                                    item: specificVariant
                                  });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                💎 {specificVariant.name}
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  ⭐ Premium
                                </Badge>
                              </CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {specificVariant.description || 'Premium quality specific variant with enhanced characteristics'}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal('specificVariant', specificVariant);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal('specificVariant', specificVariant);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-purple-50 text-purple-700">💎 Specific Grade</Badge>
                            <Badge variant="outline" className="border-purple-200 text-purple-600">⭐ Quality Enhanced</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-2">
                              <span className="w-16 text-gray-500">🔗 Parent:</span>
                              <span className="font-medium">{selectedVariant.name}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-16 text-gray-500">📅 Created:</span>
                              <span>{new Date(specificVariant.createdAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {!selectedSpecificVariant ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🚫 No Specific Variant Selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Please select a specific variant first to view its products
                </p>
              </div>
            ) : (
              <>
                {/* Enhanced Products Header with Bulk Actions */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      📦 Products for {selectedSpecificVariant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getFilteredAndSortedProducts.length} of {productsArray.length} products
                      {selectedItems.size > 0 && (
                        <span className="ml-2 text-blue-600">
                          • {selectedItems.size} selected
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Bulk Selection Controls */}
                    {getFilteredAndSortedProducts.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm">Select All</span>
                      </div>
                    )}
                    
                    {/* Bulk Actions Dropdown */}
                    {selectedItems.size > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notify('⚡ Bulk price update coming soon!', 'info')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Bulk Price
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notify('⚡ Bulk stock update coming soon!', 'info')}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Bulk Stock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notify('⚡ Bulk delete coming soon!', 'info')}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete ({selectedItems.size})
                        </Button>
                      </div>
                    )}
                    
                    {/* Import/Export Controls */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenImportExport('products')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Products
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenImportExport('products')}
                      disabled={productsArray.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export ({productsArray.length})
                    </Button>
                    
                    <Button size="sm" onClick={() => openCreateModal('product')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="pt-6">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : getFilteredAndSortedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-4">
                      {productsArray.length === 0 
                        ? `🚫 No products found for ${selectedSpecificVariant.name}` 
                        : `🔍 No products match current filters`
                      }
                    </p>
                    {productsArray.length === 0 ? (
                      <Button size="sm" onClick={() => openCreateModal('product')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setFilters({
                          status: 'all',
                          priceRange: 'all',
                          stockLevel: 'all',
                          category: 'all',
                          sortBy: 'name',
                          sortOrder: 'asc',
                        })}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {getFilteredAndSortedProducts.map((product: GraniteProduct) => (
                      <Card 
                        key={product._id} 
                        className={`group hover:shadow-xl transition-all hover:-translate-y-1 ${
                          selectedItems.has(product._id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        {/* Enhanced Image Section */}
                        <div className="relative aspect-video bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
                          <img
                            src={(product.images && product.images.length > 0 ? product.images[0] : '') || 
                                 'https://via.placeholder.com/400x240/dcfce7/16a34a?text=📦+Product'}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x240/dcfce7/16a34a?text=📦+Product';
                            }}
                          />
                          
                          {/* Multiple Images Indicator */}
                          {product.images && product.images.length > 1 && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              🖼️ {product.images.length} Images
                            </div>
                          )}
                          
                          {/* Stock Status Overlay */}
                          {(product.stock || 0) <= 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                              ❌ Out of Stock
                            </div>
                          )}
                          {(product.stock || 0) > 0 && (product.stock || 0) <= 10 && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                              ⚠️ Low Stock
                            </div>
                          )}
                          
                          {/* Selection Checkbox in Image */}
                          <div className="absolute bottom-2 left-2">
                            <Checkbox
                              checked={selectedItems.has(product._id)}
                              onCheckedChange={(checked: boolean) => handleSelectItem(product._id, checked)}
                              className="bg-white/90 border-2"
                            />
                          </div>
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2 right-2">
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
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Selection Checkbox */}
                              <Checkbox
                                checked={selectedItems.has(product._id)}
                                onCheckedChange={(checked: boolean) => handleSelectItem(product._id, checked)}
                                className="mt-1"
                              />
                              
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-start gap-2">
                                  📦 {product.name}
                                  {(product.stock || 0) <= 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Out of Stock
                                    </Badge>
                                  )}
                                  {(product.stock || 0) > 0 && (product.stock || 0) <= 10 && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Low Stock
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  📏 Unit: {product.unit || 'sq_ft'}
                                  {product.finish && product.finish.length > 0 && (
                                    <span className="ml-2">
                                      • Finishes: {product.finish.slice(0, 2).join(', ')}
                                      {product.finish.length > 2 && ` +${product.finish.length - 2} more`}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditModal('product', product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openDeleteModal('product', product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-green-600">
                              💰 ₹{product.basePrice?.toLocaleString() || 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={product.stock && product.stock > 10 ? "default" : 
                                        product.stock && product.stock > 0 ? "secondary" : "destructive"}
                                className={
                                  product.stock && product.stock > 10 ? "bg-green-100 text-green-800" :
                                  product.stock && product.stock > 0 ? "bg-yellow-100 text-yellow-800" : ""
                                }
                              >
                                📦 {product.stock || 0} units
                              </Badge>
                              <Badge 
                                variant={product.status === 'active' ? 'default' : 'secondary'}
                                className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {product.status === 'active' ? '✅' : '⏸️'} {product.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Product Details */}
                          <div className="space-y-2">
                            {product.dimensions && product.dimensions.length > 0 && (
                              <div className="text-xs text-gray-600">
                                � Dimensions: {product.dimensions.slice(0, 2).map(d => 
                                  `${d.length}×${d.width}×${d.thickness}`
                                ).join(', ')}
                                {product.dimensions.length > 2 && ` +${product.dimensions.length - 2} more`}
                              </div>
                            )}
                            
                            {product.applications && product.applications.length > 0 && (
                              <div className="text-xs text-gray-600">
                                🏗️ Uses: {product.applications.slice(0, 3).join(', ')}
                                {product.applications.length > 3 && ` +${product.applications.length - 3} more`}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>📅 Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                            <span>🔄 Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    📊 Inventory Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>🧱 Total Base Variants:</span>
                      <span className="font-medium">{variantsArray.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>💎 Total Specific Variants:</span>
                      <span className="font-medium">{specificVariantsArray.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📦 Total Products:</span>
                      <span className="font-medium">{productsArray.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    📈 Stock Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>✅ In Stock:</span>
                      <span className="font-medium text-green-600">
                        {productsArray.filter(p => (p.stock || 0) > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>🚫 Out of Stock:</span>
                      <span className="font-medium text-red-600">
                        {productsArray.filter(p => (p.stock || 0) === 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-500" />
                    💰 Value Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>💎 Total Value:</span>
                      <span className="font-bold text-green-600">
                        ₹{productsArray.reduce((acc, p) => acc + (p.basePrice || 0) * (p.stock || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Average Price:</span>
                      <span className="font-medium">
                        ₹{productsArray.length > 0 ? 
                          Math.round(productsArray.reduce((acc, p) => acc + (p.basePrice || 0), 0) / productsArray.length).toLocaleString() 
                          : '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Advanced Form Modal for Create/Edit */}
      <FormModal
        isOpen={showModal.type !== null && showModal.mode !== 'delete'}
        onClose={() => setShowModal({ type: null, mode: 'create' })}
        onSubmit={handleSave}
        title={`${showModal.mode === 'create' ? '✨ Create' : '✏️ Edit'} ${
          showModal.type === 'variant' ? 'Base Variant' : 
          showModal.type === 'specificVariant' ? 'Specific Variant' : 'Product'
        }`}
        description={
          showModal.type === 'variant' ? 'Create a new granite base variant type' :
          showModal.type === 'specificVariant' ? 'Create a new specific variant for the selected base variant' :
          'Create a new product for the selected specific variant'
        }
        fields={
          showModal.type === 'variant' ? variantFormFields :
          showModal.type === 'specificVariant' ? specificVariantFormFields :
          productFormFields
        }
        initialData={showModal.mode === 'edit' ? showModal.item : undefined}
        submitText={showModal.mode === 'create' ? '✨ Create' : '✏️ Update'}
        isLoading={isLoading}
        size="lg"
      />

      {/* Advanced Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={showModal.mode === 'delete'}
        onClose={() => setShowModal({ type: null, mode: 'create' })}
        onConfirm={handleDelete}
        title={`🗑️ Delete ${
          showModal.type === 'variant' ? 'Base Variant' : 
          showModal.type === 'specificVariant' ? 'Specific Variant' : 'Product'
        }`}
        description={`Are you sure you want to delete "${showModal.item?.name}"? This action cannot be undone.${
          showModal.type === 'variant' ? ' This will also delete all associated specific variants and products.' :
          showModal.type === 'specificVariant' ? ' This will also delete all associated products.' : ''
        }`}
        confirmText="🗑️ Delete"
        cancelText="❌ Cancel"
        variant="danger"
        isLoading={isLoading}
      />

      {/* Detailed View Modal */}
      {showDetailModal && detailModalData && (
        <DetailedViewModal
          isOpen={showDetailModal}
          onClose={closeDetailView}
          type={detailModalData.type}
          item={detailModalData.item}
        />
      )}

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
