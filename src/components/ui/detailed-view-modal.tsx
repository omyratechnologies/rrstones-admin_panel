import React, { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Image as ImageIcon,
  Calendar,
  Package,
  DollarSign,
  Layers,
  Edit,
  Trash2
} from 'lucide-react';

interface DetailedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'variant' | 'specificVariant' | 'product';
  item: any;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

const DetailedViewModal: React.FC<DetailedViewModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onEdit,
  onDelete
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  // Get images array based on type
  const getImages = (): string[] => {
    if (type === 'product' && item.images && item.images.length > 0) {
      return item.images;
    } else if (item.image) {
      return [item.image];
    }
    return [];
  };

  const images = getImages();
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getTitle = () => {
    switch (type) {
      case 'variant':
        return `🧱 ${item.name}`;
      case 'specificVariant':
        return `⭐ ${item.name}`;
      case 'product':
        return `📦 ${item.name}`;
      default:
        return item.name;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {getTitle()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOWNhM2FmIj5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4K';
                      }}
                    />
                    
                    {/* Image Navigation */}
                    {hasMultipleImages && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm bg-white/80 hover:bg-white"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm bg-white/80 hover:bg-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Thumbnails for products */}
              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${item.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzljYTNhZiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📋 Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-medium">{item.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-700">
                      {item.description || 'No description available'}
                    </p>
                  </div>

                  {/* Variant relationship for specific variants */}
                  {type === 'specificVariant' && item.variantId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Base Variant ID</label>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {typeof item.variantId === 'object' ? item.variantId._id || item.variantId.id : item.variantId}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {type === 'variant' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        🧱 Base Variant
                      </Badge>
                    )}
                    {type === 'specificVariant' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        ⭐ Specific Variant
                      </Badge>
                    )}
                    {type === 'product' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        📦 Product
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✅ {item.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Product-specific details */}
              {type === 'product' && (
                <div className="space-y-6">
                  {/* Basic Product Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">� Product Classification</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-base font-medium">{item.category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Subcategory</label>
                        <p className="text-base font-medium">{item.subcategory || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Unit Type</label>
                        <p className="text-base font-medium">{item.unit_type || item.unit || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                          {item.status === 'active' ? '✅' : '❌'} {item.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions & Specifications */}
                  {item.dimensions && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">📏 Dimensions & Specifications</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Dimensions</label>
                            <p className="text-lg font-bold text-blue-800">
                              {item.dimensionsString && item.dimensionsString !== 'undefined"×undefined"×undefined"' 
                                ? item.dimensionsString 
                                : item.dimensions && item.dimensions.length && item.dimensions.width && item.dimensions.thickness
                                  ? `${item.dimensions.length}"×${item.dimensions.width}"×${item.dimensions.thickness}"`
                                  : 'N/A'
                              }
                            </p>
                            {item.dimensions && item.dimensions.length && item.dimensions.width && item.dimensions.thickness && (
                              <p className="text-sm text-gray-600">
                                L: {item.dimensions.length}" × W: {item.dimensions.width}" × T: {item.dimensions.thickness}"
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Area per Piece</label>
                            <p className="text-lg font-bold text-blue-800">
                              {item.calculatedAreaPerPiece || item.area_per_piece || 'N/A'} sq ft
                            </p>
                            {item.weight_per_piece && (
                              <>
                                <label className="text-sm font-medium text-gray-600 block mt-2">Weight per Piece</label>
                                <p className="text-base font-medium">{item.weight_per_piece} lbs</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Size Variants Display for Multiple Size Products */}
                  {item.has_multiple_sizes && item.size_variants && item.size_variants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">📐 Size Variants</h3>
                      <div className="space-y-3">
                        {item.size_variants.map((variant: any, index: number) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Size Name</label>
                                <p className="text-lg font-bold text-blue-800">{variant.size_name}</p>
                                <p className="text-sm text-gray-600">
                                  {variant.dimensions.length}" × {variant.dimensions.width}" × {variant.dimensions.thickness}"
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Area & Weight</label>
                                <p className="text-base font-medium">{variant.area_per_piece} sq ft</p>
                                <p className="text-sm text-gray-600">{variant.weight_per_piece} lbs</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Pricing</label>
                                <p className="text-lg font-bold text-green-600">
                                  {item.pricing?.currency === 'INR' ? '₹' : '$'}{variant.price_per_piece}
                                </p>
                                {variant.price_per_sqft && (
                                  <p className="text-sm text-gray-600">
                                    {item.pricing?.currency === 'INR' ? '₹' : '$'}{variant.price_per_sqft}/sq ft
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Packaging Information */}
                  {item.packaging && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">📦 Packaging Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Pieces per Crate</label>
                            <p className="text-lg font-bold">{item.packaging.pieces_per_crate || 'N/A'}</p>
                          </div>
                          {item.packaging.pieces_per_set && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Pieces per Set</label>
                              <p className="text-lg font-bold">{item.packaging.pieces_per_set}</p>
                            </div>
                          )}
                          {item.packaging.crate_weight && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Crate Weight</label>
                              <p className="text-base font-medium">{item.packaging.crate_weight} kg</p>
                            </div>
                          )}
                          {item.packaging.pieces_weight && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Pieces Weight</label>
                              <p className="text-base font-medium">{item.packaging.pieces_weight} kg</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comprehensive Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">💰 Pricing Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-500">Base Price</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {item.pricing?.currency === 'INR' ? '₹' : '$'}{(item.basePrice || item.pricing?.price_per_unit || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">per {item.unit_type || item.unit || 'unit'}</p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-500">Stock</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {item.stock || 0} {item.unit || 'units'}
                        </p>
                      </div>

                      {item.pricing?.price_per_sqft && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-500">Price per Sq Ft</span>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            {item.pricing?.currency === 'INR' ? '₹' : '$'}{item.pricing.price_per_sqft || item.effectivePricePerSqft || 0}
                          </p>
                        </div>
                      )}

                      {item.pricing?.price_per_piece && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-500">Price per Piece</span>
                          </div>
                          <p className="text-lg font-bold text-orange-600">
                            {item.pricing?.currency === 'INR' ? '₹' : '$'}{item.pricing.price_per_piece}
                          </p>
                        </div>
                      )}

                      {item.pricing?.price_per_set && (
                        <div className="bg-teal-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-teal-600" />
                            <span className="text-sm font-medium text-gray-500">Price per Set</span>
                          </div>
                          <p className="text-lg font-bold text-teal-600">
                            {item.pricing?.currency === 'INR' ? '₹' : '$'}{item.pricing.price_per_set}
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">Currency</span>
                        </div>
                        <p className="text-lg font-bold">
                          {item.pricing?.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Features */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">✨ Product Features</h3>
                    
                    {item.finish && item.finish.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-500 block mb-2">Available Finishes</label>
                        <div className="flex flex-wrap gap-2">
                          {item.finish.map((finish: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-blue-50">
                              ✨ {finish}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.applications && item.applications.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-500 block mb-2">Applications</label>
                        <div className="flex flex-wrap gap-2">
                          {item.applications.map((app: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-green-50">
                              🏗️ {app.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.special_features && item.special_features.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">Special Features</label>
                        <div className="flex flex-wrap gap-2">
                          {item.special_features.map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-yellow-50">
                              ⭐ {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variant Relationship */}
                  {item.variantSpecificId && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">🔗 Variant Information</h3>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Specific Variant</label>
                            <p className="text-lg font-bold text-indigo-800">
                              {item.variantSpecificId.name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Variant ID</label>
                            <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                              {item.variantSpecificId._id || item.variantSpecificId.id}
                            </p>
                          </div>
                          {item.variantSpecificId.variantId && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Base Variant</label>
                              <p className="text-sm font-semibold text-gray-800">
                                {item.variantSpecificId.variantId.name || 'N/A'}
                              </p>
                              <p className="text-xs font-mono bg-white px-2 py-1 rounded border mt-1">
                                ID: {item.variantSpecificId.variantId._id || item.variantSpecificId.variantId.id}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-semibold mb-3">📅 Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">Updated:</span>
                    <span className="font-medium">{formatDate(item.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {item._id || item.id}
                    </span>
                  </div>
                  {item.__v !== undefined && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Version:</span>
                      <span className="font-medium">{item.__v}</span>
                    </div>
                  )}
                  {item.meta_data && Object.keys(item.meta_data).length > 0 && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Metadata:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {JSON.stringify(item.meta_data)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {onEdit && (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => {
                      onEdit(item);
                      onClose();
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit {type === 'variant' ? 'Variant' : type === 'specificVariant' ? 'Specific Variant' : 'Product'}
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      onDelete(item);
                      onClose();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedViewModal;
