import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Weight, 
  Calculator, 
  User, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { orderApi } from '@/services/api';

interface OrderWithBusinessLogic {
  _id: string;
  userId: string;
  items: Array<{
    variantTypeId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    finalPrice: number;
    metadata?: {
      crateQty?: number;
      pieceQty?: number;
      fillerPieces?: number;
      weight?: number;
      fillerCharges?: number;
    };
  }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  shippingAddress: any;
  notes?: string;
  status: string;
  paymentStatus: string;
  metadata?: {
    delivery?: {
      method: 'delivery' | 'pickup';
      weightValidation: {
        isOverLimit: boolean;
        forcePickup: boolean;
        message?: string;
      };
    };
    calculations?: {
      totalWeight: number;
      fillerCharges: number;
      orderType: string;
    };
  };
  createdAt: string;
}

interface EnhancedOrderManagementProps {
  orderId?: string;
}

const EnhancedOrderManagement: React.FC<EnhancedOrderManagementProps> = ({ orderId }) => {
  const [order, setOrder] = useState<OrderWithBusinessLogic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch order details
  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await orderApi.getOrder(orderId);
      setOrder(response.data as unknown as OrderWithBusinessLogic);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No order selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order #{order._id.slice(-8)}</h2>
          <p className="text-gray-600">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order Items</span>
          </h3>
          
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.finalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                </div>
                
                {/* Business Logic Details */}
                {item.metadata && (
                  <div className="border-t pt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      {item.metadata.crateQty !== undefined && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span>Crates: {item.metadata.crateQty}</span>
                        </div>
                      )}
                      {item.metadata.pieceQty !== undefined && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Package className="h-4 w-4 text-green-500" />
                          <span>Pieces: {item.metadata.pieceQty}</span>
                        </div>
                      )}
                      {item.metadata.fillerPieces !== undefined && item.metadata.fillerPieces > 0 && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Calculator className="h-4 w-4 text-orange-500" />
                          <span>Filler: {item.metadata.fillerPieces}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {item.metadata.weight !== undefined && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Weight className="h-4 w-4 text-gray-500" />
                          <span>Weight: {item.metadata.weight.toFixed(1)} lbs</span>
                        </div>
                      )}
                      {item.metadata.fillerCharges !== undefined && item.metadata.fillerCharges > 0 && (
                        <div className="flex items-center space-x-1 mb-1">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <span>Filler Charges: ${item.metadata.fillerCharges.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Order Summary</span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Discount ({order.discountPercent}%):</span>
                <span className="text-green-600">-${order.discountAmount.toFixed(2)}</span>
              </div>
              
              {order.metadata?.calculations?.fillerCharges && order.metadata.calculations.fillerCharges > 0 && (
                <div className="flex justify-between">
                  <span>Filler Charges:</span>
                  <span className="text-orange-600">${order.metadata.calculations.fillerCharges.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {order.metadata?.delivery && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Delivery</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    order.metadata.delivery.method === 'delivery' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {order.metadata.delivery.method === 'delivery' ? 'Delivery' : 'Pickup'}
                  </span>
                </div>
                
                {order.metadata.calculations?.totalWeight && (
                  <div className="flex items-center space-x-1 text-sm">
                    <Weight className="h-4 w-4 text-gray-500" />
                    <span>Total Weight: {order.metadata.calculations.totalWeight.toFixed(1)} lbs</span>
                  </div>
                )}
                
                {order.metadata.delivery.weightValidation.isOverLimit && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">
                        {order.metadata.delivery.weightValidation.message}
                      </span>
                    </div>
                    {order.metadata.delivery.weightValidation.forcePickup && (
                      <div className="flex items-center space-x-1 mt-1 text-sm text-yellow-700">
                        <MapPin className="h-4 w-4" />
                        <span>Pickup required due to weight limit</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Customer</span>
            </h3>
            
            <div className="text-sm space-y-2">
              <p>User ID: {order.userId}</p>
              
              {order.shippingAddress && (
                <div>
                  <p className="font-medium mb-1">Shipping Address:</p>
                  <div className="text-gray-600">
                    {typeof order.shippingAddress === 'string' ? (
                      <p>{order.shippingAddress}</p>
                    ) : (
                      <div>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {order.notes && (
                <div>
                  <p className="font-medium mb-1">Notes:</p>
                  <p className="text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Metadata */}
          {order.metadata?.calculations && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Business Logic</span>
              </h3>
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Order Type:</span>
                  <span className="font-medium">{order.metadata.calculations.orderType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span>{order.metadata.calculations.totalWeight.toFixed(1)} lbs</span>
                </div>
                
                {order.metadata.calculations.fillerCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Filler Charges:</span>
                    <span>${order.metadata.calculations.fillerCharges.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOrderManagement;