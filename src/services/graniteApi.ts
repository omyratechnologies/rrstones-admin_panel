import apiService from './apiService';
import type { 
  GraniteVariant, 
  SpecificGraniteVariant,
  GraniteProduct,
  ApiResponse, 
  PaginatedResponse 
} from '@/types';

export const graniteApi = {
  // Granite Variants (Base Types)
  getVariants: async (): Promise<ApiResponse<GraniteVariant[]>> => {
    return apiService.get('/granite/variants');
  },

  getVariant: async (id: string): Promise<ApiResponse<GraniteVariant>> => {
    return apiService.get(`/granite/variants/${id}`);
  },

  createVariant: async (data: Omit<GraniteVariant, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<GraniteVariant>> => {
    return apiService.post('/granite/variants', data);
  },

  updateVariant: async (id: string, data: Partial<GraniteVariant>): Promise<ApiResponse<GraniteVariant>> => {
    return apiService.put(`/granite/variants/${id}`, data);
  },

  deleteVariant: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/granite/variants/${id}`);
  },

  // Specific Granite Variants
  getSpecificVariants: async (): Promise<ApiResponse<SpecificGraniteVariant[]>> => {
    return apiService.get('/granite/specific-variants?limit=1000');
  },

  getSpecificVariant: async (id: string): Promise<ApiResponse<SpecificGraniteVariant>> => {
    return apiService.get(`/granite/specific-variants/${id}`);
  },

  getSpecificVariantsByVariant: async (variantId: string): Promise<ApiResponse<SpecificGraniteVariant[]>> => {
    return apiService.get(`/granite/specific-variants/by-variant/${variantId}`);
  },

  createSpecificVariant: async (data: Omit<SpecificGraniteVariant, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SpecificGraniteVariant>> => {
    return apiService.post('/granite/specific-variants', data);
  },

  updateSpecificVariant: async (id: string, data: Partial<SpecificGraniteVariant>): Promise<ApiResponse<SpecificGraniteVariant>> => {
    return apiService.put(`/granite/specific-variants/${id}`, data);
  },

  deleteSpecificVariant: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/granite/specific-variants/${id}`);
  },

  // Granite Products
  getProducts: async (params?: any): Promise<PaginatedResponse<GraniteProduct>> => {
    return apiService.get('/granite/products', { params });
  },

  getProduct: async (id: string): Promise<ApiResponse<GraniteProduct>> => {
    return apiService.get(`/granite/products/${id}`);
  },

  getProductsBySpecificVariant: async (specificVariantId: string): Promise<ApiResponse<GraniteProduct[]>> => {
    return apiService.get(`/granite/specific-variants/${specificVariantId}/products`);
  },

  createProduct: async (data: Omit<GraniteProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<GraniteProduct>> => {
    return apiService.post('/granite/products', data);
  },

  updateProduct: async (id: string, data: Partial<GraniteProduct>): Promise<ApiResponse<GraniteProduct>> => {
    return apiService.put(`/granite/products/${id}`, data);
  },

  deleteProduct: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/granite/products/${id}`);
  },

  updateProductInventory: async (id: string, stock: number): Promise<ApiResponse> => {
    return apiService.put(`/granite/products/${id}/inventory`, { stock });
  },

  // Utility endpoints
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return apiService.get('/granite/categories');
  },

  getColors: async (): Promise<ApiResponse<string[]>> => {
    return apiService.get('/granite/colors');
  },

  getFinishes: async (): Promise<ApiResponse<string[]>> => {
    return apiService.get('/granite/finishes');
  },

  getThicknesses: async (): Promise<ApiResponse<string[]>> => {
    return apiService.get('/granite/thicknesses');
  },

  searchProducts: async (query: string): Promise<ApiResponse<GraniteProduct[]>> => {
    return apiService.get('/granite/search', { params: { q: query } });
  },

  // NEW: Business logic endpoints
  calculateCart: async (data: {
    items: Array<{
      productId: string;
      sizeVariant?: string;
      crates?: number;
      pieces?: number;
    }>;
    userTier?: string;
    customDiscount?: number;
    shippingFee?: number;
  }): Promise<ApiResponse<any>> => {
    return apiService.post('/granite/calculate-cart', data);
  },

  checkShippingWeight: async (data: {
    items: Array<{
      productId: string;
      sizeVariant?: string;
      quantity: number;
    }>;
  }): Promise<ApiResponse<any>> => {
    return apiService.post('/granite/check-shipping-weight', data);
  },

  getProductSizes: async (productId: string): Promise<ApiResponse<any>> => {
    return apiService.get(`/granite/products/${productId}/sizes`);
  },

  getBusinessConfig: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/granite/business-config');
  },

  // Bulk operations
  bulkUpdateProducts: async (productIds: string[], updates: Partial<GraniteProduct>): Promise<ApiResponse> => {
    return apiService.put('/granite/products/bulk', { productIds, updates });
  },

  exportProducts: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return apiService.downloadFile(`/granite/products/export/${format}`, `products.${format}`);
  },

  importProducts: async (file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> => {
    return apiService.uploadFile('/granite/products/import', file, onProgress);
  },

  // Hierarchy validation and dependency checks
  checkVariantDependencies: async (id: string): Promise<ApiResponse<{
    canDelete: boolean;
    dependencies: { specificVariants: number; products: number };
    message: string;
    totalDependents: number;
  }>> => {
    return apiService.get(`/granite/variants/${id}/dependencies`);
  },

  checkSpecificVariantDependencies: async (id: string): Promise<ApiResponse<{
    canDelete: boolean;
    dependencies: { products: number };
    message: string;
    totalDependents: number;
  }>> => {
    return apiService.get(`/granite/specific-variants/${id}/dependencies`);
  },

  getHierarchyInfo: async (): Promise<ApiResponse<{
    hierarchy: Array<{
      level: number;
      name: string;
      description: string;
      canDelete: string;
    }>;
    rules: string[];
  }>> => {
    return apiService.get('/granite/hierarchy-info');
  },
};
