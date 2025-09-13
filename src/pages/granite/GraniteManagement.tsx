import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, Upload, Download } from 'lucide-react';
import { graniteApi } from '@/services/graniteApi';
import type { GraniteVariant, GraniteProduct } from '@/types';

export function GraniteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<GraniteVariant | null>(null);

  // Fetch granite data
  const { data: variantsResponse, isLoading: variantsLoading } = useQuery({
    queryKey: ['granite-variants'],
    queryFn: graniteApi.getVariants,
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['granite-products', selectedVariant?._id],
    queryFn: () => graniteApi.getProducts(selectedVariant?._id),
    enabled: !!selectedVariant?._id,
  });

  // Extract data from API responses
  const variants = variantsResponse?.data || [];
  const products = productsResponse?.data || [];

  const filteredVariants = variants.filter((variant: GraniteVariant) =>
    variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (variant.description && variant.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Granite Management</h1>
          <p className="text-muted-foreground">
            Manage granite variants, specific variants, and products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search granite variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="variants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variants">Granite Variants</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="variants" className="space-y-4">
          {variantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVariants.map((variant: GraniteVariant) => (
                <Card 
                  key={variant._id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedVariant?._id === variant._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{variant.name}</CardTitle>
                        <CardDescription>{variant.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Granite</Badge>
                      <Badge variant="outline">Premium</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Created:</strong> {new Date(variant.createdAt).toLocaleDateString()}</p>
                      <p><strong>Updated:</strong> {new Date(variant.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                      <span className="text-blue-600 font-medium">
                        In Stock
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {!selectedVariant ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a granite variant to view its products
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Products for {selectedVariant.name}
                </h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {productsLoading ? (
                <div className="space-y-2">
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
                <div className="space-y-2">
                  {products.map((product: GraniteProduct) => (
                    <Card key={product._id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{product.name}</h4>
                              <Badge 
                                variant={product.status === 'active' ? 'default' : 'secondary'}
                              >
                                {product.status === 'active' ? 'Available' : 'Out of Stock'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Finish options: {product.finish.join(', ')}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Dimensions:</span> {product.dimensions.length} options
                              </div>
                              <div>
                                <span className="font-medium">Unit:</span> {product.unit}
                              </div>
                              <div>
                                <span className="font-medium">Stock:</span> {product.stock}
                              </div>
                              <div>
                                <span className="font-medium">Base Price:</span> ₹{product.basePrice}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Variants</CardDescription>
                <CardTitle className="text-2xl">{variants.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Products</CardDescription>
                <CardTitle className="text-2xl">
                  {products.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Available Stock</CardDescription>
                <CardTitle className="text-2xl text-green-600">85%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Low Stock Items</CardDescription>
                <CardTitle className="text-2xl text-red-600">12</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Top Variants Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Granite Variants</CardTitle>
              <CardDescription>Top performing variants by sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                <p className="text-muted-foreground">Charts coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
