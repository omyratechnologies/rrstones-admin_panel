import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, Upload, Download, 
  Package, Layers, ShoppingCart, TrendingUp,
  Star, Settings
} from 'lucide-react';
import { graniteApi } from '../../services/graniteApi';
import type { GraniteVariant, SpecificGraniteVariant, GraniteProduct } from '../../types';
import { FormModal } from '../../components/ui/form-modal';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { uploadImage } from '../../services/uploadService';

export function GraniteManagement() {
  const [selectedVariant, setSelectedVariant] = useState<GraniteVariant | null>(null);
  const [selectedSpecificVariant, setSelectedSpecificVariant] = useState<SpecificGraniteVariant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [showModal, setShowModal] = useState<{
    type: 'variant' | 'specificVariant' | 'product' | 'delete' | null;
    mode: 'create' | 'edit' | 'delete';
    item?: any;
  }>({ type: null, mode: 'create' });

  const queryClient = useQueryClient();

  // Simple alert function
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    alert(`${type.toUpperCase()}: ${message}`);
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏗️ Granite Catalog Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                ✨ Complete CRUD operations for granite inventory management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
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
        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="🔍 Search granite variants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? '📋 List' : '🧩 Grid'}
              </Button>
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
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Base Variants</CardDescription>
                    <Layers className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{variantsArray.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-green-600">🏗️ Foundation types</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Specific Variants</CardDescription>
                    <Package className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{specificVariantsArray.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-green-600">💎 Quality grades</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Products</CardDescription>
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold">{productsArray.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-green-600">📦 Ready for sale</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Total Value</CardDescription>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    ₹{productsArray.reduce((acc, p) => acc + (p.basePrice || 0) * (p.stock || 0), 0).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-green-600">💰 Inventory value</div>
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">🧱 Base Granite Variants</h3>
              <Button size="sm" onClick={() => openCreateModal('variant')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Base Variant
              </Button>
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
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedVariant?._id === variant._id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedSpecificVariant(null);
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">🧱 {variant.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {variant.description || 'No description available'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal('variant', variant);
                            }}
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">🧱 Base Variant</Badge>
                        <Badge variant="outline">✅ Active</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>📅 Created: {new Date(variant.createdAt).toLocaleDateString()}</p>
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    💎 Specific Variants for {selectedVariant.name}
                  </h3>
                  <Button size="sm" onClick={() => openCreateModal('specificVariant')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specific Variant
                  </Button>
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
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedSpecificVariant?._id === specificVariant._id ? 'ring-2 ring-green-500 shadow-lg' : ''
                        }`}
                        onClick={() => setSelectedSpecificVariant(specificVariant)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">💎 {specificVariant.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {specificVariant.description || 'Standard quality grade'}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1 ml-2">
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
                            <Badge variant="secondary">💎 Specific Variant</Badge>
                            <Badge variant="outline">⭐ Quality Grade</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>🔗 Parent: {selectedVariant.name}</p>
                            <p>📅 Created: {new Date(specificVariant.createdAt).toLocaleDateString()}</p>
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    📦 Products for {selectedSpecificVariant.name}
                  </h3>
                  <Button size="sm" onClick={() => openCreateModal('product')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {productsLoading ? (
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
                ) : productsArray.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-4">
                      🚫 No products found for {selectedSpecificVariant.name}
                    </p>
                    <Button size="sm" onClick={() => openCreateModal('product')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productsArray.map((product: GraniteProduct) => (
                      <Card key={product._id} className="hover:shadow-lg transition-all">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">📦 {product.name}</CardTitle>
                              <CardDescription className="mt-1">
                                📏 Unit: {product.unit || 'sq_ft'}
                              </CardDescription>
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
                            <Badge 
                              variant={product.stock && product.stock > 0 ? "default" : "destructive"}
                            >
                              📦 Stock: {product.stock || 0}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">📦 Product</Badge>
                            <Badge variant="outline">
                              {product.stock && product.stock > 0 ? '✅ In Stock' : '🚫 Out of Stock'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>📅 Created: {new Date(product.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
}
