import apiService from './apiService';
import type { 
  Order, 
  Invoice,
  Tier,
  DashboardStats,
  ActivityLog,
  SecurityLog,
  ApiResponse, 
  PaginatedResponse,
  OrderFilters 
} from '@/types';

export const orderApi = {
  // Orders
  getOrders: async (filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> => {
    return apiService.get('/orders', { params: filters });
  },

  getAllOrders: async (filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> => {
    return apiService.get('/orders/all', { params: filters });
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiService.get(`/orders/${id}`);
  },

  createOrder: async (orderData: any): Promise<ApiResponse<Order>> => {
    return apiService.post('/orders', orderData);
  },

  updateOrderStatus: async (id: string, status: string): Promise<ApiResponse<Order>> => {
    return apiService.put(`/orders/${id}/status`, { status });
  },

  cancelOrder: async (id: string, reason?: string): Promise<ApiResponse> => {
    return apiService.put(`/orders/${id}/cancel`, { reason });
  },

  exportOrders: async (format: 'csv' | 'excel' = 'csv', _filters?: OrderFilters): Promise<void> => {
    return apiService.downloadFile(`/orders/export/${format}`, `orders.${format}`);
  },
};

export const invoiceApi = {
  // Invoices
  getInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    return apiService.get('/invoices');
  },

  getAllInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    return apiService.get('/invoices/all');
  },

  getOverdueInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    return apiService.get('/invoices/overdue');
  },

  getInvoice: async (id: string): Promise<ApiResponse<Invoice>> => {
    return apiService.get(`/invoices/${id}`);
  },

  createInvoice: async (orderIds: string[]): Promise<ApiResponse<Invoice>> => {
    return apiService.post('/invoices', { orderIds });
  },

  markInvoicePaid: async (id: string): Promise<ApiResponse<Invoice>> => {
    return apiService.put(`/invoices/${id}/paid`);
  },
};

export const tierApi = {
  // Tiers
  getTiers: async (): Promise<ApiResponse<Tier[]>> => {
    return apiService.get('/tiers');
  },

  createTier: async (tierData: Omit<Tier, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Tier>> => {
    return apiService.post('/tiers', tierData);
  },

  updateTier: async (id: string, tierData: Partial<Tier>): Promise<ApiResponse<Tier>> => {
    return apiService.put(`/tiers/${id}`, tierData);
  },

  deleteTier: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/tiers/${id}`);
  },
};

export const analyticsApi = {
  // Analytics
  getDashboardAnalytics: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiService.get('/analytics/dashboard');
  },

  getSalesAnalytics: async (params?: any): Promise<ApiResponse<any>> => {
    return apiService.get('/analytics/sales', { params });
  },

  getInventoryAnalytics: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/analytics/inventory');
  },

  getCustomerAnalytics: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/analytics/customers');
  },
};

export const adminApi = {
  // Admin operations
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiService.get('/admin/dashboard');
  },

  getSystemAnalytics: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/admin/analytics');
  },

  createAdminUser: async (userData: any): Promise<ApiResponse<any>> => {
    return apiService.post('/admin/users', userData);
  },

  // Activity Logs
  getActivityLogs: async (params?: any): Promise<PaginatedResponse<ActivityLog>> => {
    return apiService.get('/admin/activity-logs', { params });
  },

  exportActivityLogs: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return apiService.downloadFile(`/admin/activity-logs/export/${format}`, `activity-logs.${format}`);
  },

  // Security Logs
  getSecurityLogs: async (params?: any): Promise<PaginatedResponse<SecurityLog>> => {
    return apiService.get('/admin/security-logs', { params });
  },

  exportSecurityLogs: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return apiService.downloadFile(`/admin/security-logs/export/${format}`, `security-logs.${format}`);
  },
};

export const healthApi = {
  // Health checks
  getHealth: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/health');
  },

  getLiveness: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/health/liveness');
  },

  getReadiness: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/health/readiness');
  },

  getMetrics: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/health/metrics');
  },
};
