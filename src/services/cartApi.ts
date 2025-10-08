import apiService from './apiService';
import type { ApiResponse } from '@/types';

// Cart item interface matching backend
interface CartItem {
  variantTypeId: string;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  finalPrice: number;
  metadata?: {
    crateQty?: number;
    pieceQty?: number;
    piecesPerCrate?: number;
    fillerPieces?: number;
    fillerCharges?: number;
    weight?: number;
  };
}

// Cart interface matching backend
interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'active' | 'checkedout';
  reservedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Cart summary with business logic calculations
interface CartSummary {
  cart: Cart;
  calculation: {
    subtotal: number;
    discountAmount: number;
    discountPercent: number;
    fillerCharges: number;
    finalTotal: number;
    totalWeight: number;
    items: Array<{
      productId: string;
      crateQty: number;
      pieceQty: number;
      totalPieces: number;
      fillerPieces: number;
      unitPrice: number;
      itemSubtotal: number;
      fillerCharges: number;
      weight: number;
      product: any;
    }>;
    weightValidation: {
      isOverLimit: boolean;
      forcePickup: boolean;
      message?: string;
    };
  };
  user: {
    tier: string;
    discountPercent: number;
  };
  isReserved: boolean;
  reservedUntil?: Date;
}

// Add to cart request
interface AddToCartRequest {
  variantTypeId: string;
  crateQty?: number;
  pieceQty?: number;
}

// Update cart item request
interface UpdateCartItemRequest {
  crateQty?: number;
  pieceQty?: number;
}

export const cartApi = {
  // Get user's active cart
  getCart: async (): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.get('/cart');
  },

  // Add item to cart with crate/piece quantities
  addToCart: async (data: AddToCartRequest): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.post('/cart/add', data);
  },

  // Update cart item quantities
  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.put(`/cart/update/${itemId}`, data);
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.delete(`/cart/remove/${itemId}`);
  },

  // Clear entire cart
  clearCart: async (): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.delete('/cart/clear');
  },

  // Get cart summary with business logic calculations
  getCartSummary: async (): Promise<ApiResponse<CartSummary>> => {
    return apiService.get('/cart/summary');
  },

  // Start checkout process (reserve stock)
  startCheckout: async (): Promise<ApiResponse<{ cart: Cart; reservedUntil: Date }>> => {
    return apiService.post('/cart/checkout/start');
  },

  // Cancel checkout process (release reserved stock)
  cancelCheckout: async (): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.post('/cart/checkout/cancel');
  },

  // Apply promo code
  applyPromoCode: async (promoCode: string): Promise<ApiResponse<{ cart: Cart }>> => {
    return apiService.post('/cart/promo', { promoCode });
  }
};

export type { Cart, CartItem, CartSummary, AddToCartRequest, UpdateCartItemRequest };