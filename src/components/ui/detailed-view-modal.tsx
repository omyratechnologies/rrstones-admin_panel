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
}

const DetailedViewModal: React.FC<DetailedViewModalProps> = ({
  isOpen,
  onClose,
  type,
  item
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
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x500/f3f4f6/9ca3af?text=No+Image';
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
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=No+Image';
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
                      ✅ Active
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Product-specific details */}
              {type === 'product' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">💰 Product Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-500">Base Price</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        ₹{item.basePrice?.toLocaleString() || '0'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-500">Stock</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {item.stock || 0} {item.unit || 'units'}
                      </p>
                    </div>
                  </div>

                  {item.finish && item.finish.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 block mb-2">Available Finishes</label>
                      <div className="flex flex-wrap gap-2">
                        {item.finish.map((finish: string, index: number) => (
                          <Badge key={index} variant="outline">
                            ✨ {finish}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.applications && item.applications.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 block mb-2">Applications</label>
                      <div className="flex flex-wrap gap-2">
                        {item.applications.map((app: string, index: number) => (
                          <Badge key={index} variant="outline">
                            🏗️ {app}
                          </Badge>
                        ))}
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
                      {item._id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => {
                    // Handle edit action
                    onClose();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit {type === 'variant' ? 'Variant' : type === 'specificVariant' ? 'Specific Variant' : 'Product'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    // Handle delete action
                    onClose();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedViewModal;
