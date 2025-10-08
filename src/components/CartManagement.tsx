import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Package, 
  Weight, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  MapPin
} from 'lucide-react';
import { cartApi, graniteApi } from '@/services/api';
import type { CartSummary, AddToCartRequest } from '@/services/cartApi';

interface CartManagementProps {
  userId?: string;
  onOrderCreated?: (orderId: string) => void;
}

const CartManagement: React.FC<CartManagementProps> = () => {
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [crateQty, setCrateQty] = useState(0);
  const [pieceQty, setPieceQty] = useState(0);

  // Fetch cart summary
  const fetchCartSummary = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCartSummary();
      setCartSummary(response.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available products
  const fetchProducts = async () => {
    try {
      const response = await graniteApi.getVariants();
      setProducts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchCartSummary();
    fetchProducts();
  }, []);

  // Add product to cart
  const handleAddToCart = async () => {
    if (!selectedProduct || (crateQty === 0 && pieceQty === 0)) {
      setError('Please select a product and specify quantities');
      return;
    }

    try {
      setLoading(true);
      const addRequest: AddToCartRequest = {
        variantTypeId: selectedProduct,
        crateQty: crateQty || undefined,
        pieceQty: pieceQty || undefined
      };
      
      await cartApi.addToCart(addRequest);
      await fetchCartSummary();
      
      // Reset form
      setSelectedProduct('');
      setCrateQty(0);
      setPieceQty(0);
      setShowAddProduct(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (itemId: string) => {
    try {
      setLoading(true);
      await cartApi.removeFromCart(itemId);
      await fetchCartSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  // Start checkout
  const handleStartCheckout = async () => {
    try {
      setLoading(true);
      await cartApi.startCheckout();
      await fetchCartSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  // Cancel checkout
  const handleCancelCheckout = async () => {
    try {
      setLoading(true);
      await cartApi.cancelCheckout();
      await fetchCartSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel checkout');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cartSummary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Cart Management</h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Add Product Form */}
      {showAddProduct && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Add Product to Cart</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {product.category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Crate Quantity</label>
              <input
                type="number"
                value={crateQty}
                onChange={(e) => setCrateQty(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Piece Quantity</label>
              <input
                type="number"
                value={pieceQty}
                onChange={(e) => setPieceQty(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddProduct(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {cartSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-medium">Cart Items</h3>
            
            {cartSummary.cart.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cartSummary.cart.items.map((item, index) => {
                const calculatedItem = cartSummary.calculation.items[index];
                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{calculatedItem?.product?.name || 'Product'}</h4>
                        <p className="text-sm text-gray-600">{calculatedItem?.product?.category}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem((item as any)._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {calculatedItem && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span>Crates: {calculatedItem.crateQty}</span>
                          </div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Package className="h-4 w-4 text-green-500" />
                            <span>Pieces: {calculatedItem.pieceQty}</span>
                          </div>
                          {calculatedItem.fillerPieces > 0 && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Calculator className="h-4 w-4 text-orange-500" />
                              <span>Filler: {calculatedItem.fillerPieces}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Weight className="h-4 w-4 text-gray-500" />
                            <span>Weight: {calculatedItem.weight.toFixed(1)} lbs</span>
                          </div>
                          <div className="font-medium">
                            Subtotal: ${calculatedItem.itemSubtotal.toFixed(2)}
                          </div>
                          {calculatedItem.fillerCharges > 0 && (
                            <div className="text-orange-600">
                              Filler Charges: ${calculatedItem.fillerCharges.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Summary</h3>
            
            {/* Business Logic Summary */}
            {cartSummary.calculation && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${cartSummary.calculation.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Discount ({cartSummary.calculation.discountPercent}%):</span>
                  <span className="text-green-600">-${cartSummary.calculation.discountAmount.toFixed(2)}</span>
                </div>
                
                {cartSummary.calculation.fillerCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Filler Charges:</span>
                    <span className="text-orange-600">${cartSummary.calculation.fillerCharges.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${cartSummary.calculation.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Weight className="h-4 w-4" />
                  <span>Total Weight: {cartSummary.calculation.totalWeight.toFixed(1)} lbs</span>
                </div>
                
                {/* Weight Validation */}
                {cartSummary.calculation.weightValidation.isOverLimit && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">
                        {cartSummary.calculation.weightValidation.message}
                      </span>
                    </div>
                    {cartSummary.calculation.weightValidation.forcePickup && (
                      <div className="flex items-center space-x-1 mt-1 text-sm text-yellow-700">
                        <MapPin className="h-4 w-4" />
                        <span>Pickup required</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* User Tier Info */}
            {cartSummary.user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm">
                  <div>Tier: <span className="font-medium">{cartSummary.user.tier}</span></div>
                  <div>Discount: <span className="font-medium">{cartSummary.user.discountPercent}%</span></div>
                </div>
              </div>
            )}
            
            {/* Checkout Status */}
            {cartSummary.isReserved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Stock Reserved</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-green-600 mb-3">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {cartSummary.reservedUntil ? new Date(cartSummary.reservedUntil).toLocaleTimeString() : 'N/A'}</span>
                </div>
                <button
                  onClick={handleCancelCheckout}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel Checkout
                </button>
              </div>
            ) : (
              cartSummary.cart.items.length > 0 && (
                <button
                  onClick={handleStartCheckout}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Start Checkout</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartManagement;