import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  X, 
  Package, 
  DollarSign, 
  Ruler, 
  Tag, 
  Image as ImageIcon,
  Edit,
  Calendar,
  Settings
} from 'lucide-react';
import type { GraniteProduct } from '../../types';

interface ModernProductDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  product: GraniteProduct | null;
}

export default function ModernProductDetails({ 
  isOpen, 
  onClose, 
  onEdit, 
  product 
}: ModernProductDetailsProps) {
  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDimensions = (dimensions: any) => {
    if (!dimensions) return 'N/A';
    return `${dimensions.length}\" × ${dimensions.width}\" × ${dimensions.thickness}\"`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-200';
      case 'out_of_stock': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-orange-600' };
    return { label: 'In Stock', color: 'text-green-600' };
  };

  const stockStatus = getStockStatus(product.stock || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Product Name</label>
                      <p className="text-gray-900 mt-1">{product.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="text-gray-900 mt-1">{product.category}</p>
                    </div>
                    {product.subcategory && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subcategory</label>
                        <p className="text-gray-900 mt-1">{product.subcategory}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(product.status || 'active')}>
                          {product.status?.charAt(0).toUpperCase() + product.status?.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dimensions & Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="w-5 h-5" />
                    Dimensions & Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.has_multiple_sizes && product.size_variants?.length ? (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Size Variants</h4>
                      <div className="grid gap-4">
                        {product.size_variants.map((variant: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Size:</span>
                                <p className="text-gray-900">{variant.size_name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Dimensions:</span>
                                <p className="text-gray-900">{formatDimensions(variant.dimensions)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Area:</span>
                                <p className="text-gray-900">{variant.area_per_piece} sq ft</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Price:</span>
                                <p className="text-gray-900 font-medium">{formatCurrency(variant.price_per_piece, product.pricing?.currency)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Dimensions</label>
                        <p className="text-gray-900 mt-1">{formatDimensions(product.dimensions)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Area per Piece</label>
                        <p className="text-gray-900 mt-1">{product.area_per_piece || 'N/A'} sq ft</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Weight per Piece</label>
                        <p className="text-gray-900 mt-1">{product.weight_per_piece || 'N/A'} lbs</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Configuration */}
              {product.business_config && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="w-5 h-5" />
                      Business Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Pieces per Crate</label>
                        <p className="text-gray-900 mt-1">{product.business_config.pieces_per_crate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Filler Rate</label>
                        <p className="text-gray-900 mt-1">{(product.business_config.filler_rate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Max Shipping Weight</label>
                        <p className="text-gray-900 mt-1">{product.business_config.max_shipping_weight.toLocaleString()} {product.business_config.weight_unit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              {(product.finish?.length || product.applications?.length) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features & Applications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.finish?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Available Finishes</label>
                        <div className="flex flex-wrap gap-2">
                          {product.finish.map((finish: string) => (
                            <Badge key={finish} variant="outline" className="capitalize">
                              {finish.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.applications?.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Suitable Applications</label>
                        <div className="flex flex-wrap gap-2">
                          {product.applications.map((app: string) => (
                            <Badge key={app} variant="outline" className="capitalize">
                              {app.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Pricing & Images */}
            <div className="space-y-6">
              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Price per Unit</label>
                    <p className="text-xl font-semibold text-gray-900 mt-1">
                      {formatCurrency(product.pricing?.price_per_unit || product.basePrice || 0, product.pricing?.currency)}
                    </p>
                  </div>
                  {product.pricing?.price_per_sqft && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price per Sq Ft</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">
                        {formatCurrency(product.pricing.price_per_sqft, product.pricing.currency)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Unit Type</label>
                    <p className="text-gray-900 mt-1 capitalize">{product.unit_type || product.unit}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Stock</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xl font-semibold text-gray-900">{product.stock || 0}</p>
                      <Badge className={stockStatus.color === 'text-red-600' ? 'bg-red-100 text-red-800' : 
                                       stockStatus.color === 'text-orange-600' ? 'bg-orange-100 text-orange-800' : 
                                       'bg-green-100 text-green-800'}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>
                  {product.packaging && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Pieces per Crate</label>
                        <p className="text-gray-900 mt-1">{product.packaging.pieces_per_crate}</p>
                      </div>
                      {product.packaging.crate_weight && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Crate Weight</label>
                          <p className="text-gray-900 mt-1">{product.packaging.crate_weight} lbs</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Product Images */}
              {product.images?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ImageIcon className="w-5 h-5" />
                      Product Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {product.images.map((image: string, index: number) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={image} 
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">Created</label>
                    <p className="text-gray-900 mt-1">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-900 mt-1">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {product._id && (
                    <div>
                      <label className="font-medium text-gray-600">Product ID</label>
                      <p className="text-gray-900 mt-1 font-mono text-xs">{product._id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}