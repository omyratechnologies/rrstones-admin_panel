import apiService from './apiService';
import type { 
  Order, 
  Invoice,
  Tier,
  DashboardStats,
  ActivityLog,
  SecurityLog,
  Session,
  ApiResponse, 
  PaginatedResponse,
  OrderFilters 
} from '@/types';

// Custom interface for orders response structure
interface OrdersApiResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: {
      current: number;
      total: number;
      totalItems: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: any;
  };
}

export const orderApi = {
  // Orders
  getOrders: async (filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> => {
    return apiService.get('/orders', { params: filters });
  },

  getAllOrders: async (filters: OrderFilters = {}): Promise<OrdersApiResponse> => {
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
  getTiers: async (): Promise<ApiResponse<{ tiers: Tier[] }>> => {
    return apiService.get('/tiers');
  },

  getTierStats: async (): Promise<ApiResponse<{ tiers: Tier[]; totalUsers: number }>> => {
    return apiService.get('/tiers/stats');
  },

  getTier: async (tier: string): Promise<ApiResponse<{ tier: Tier }>> => {
    return apiService.get(`/tiers/${tier}`);
  },

  getTierUsage: async (tier: string): Promise<ApiResponse<any>> => {
    return apiService.get(`/tiers/${tier}/usage`);
  },

  createTier: async (tierData: Omit<Tier, '_id' | 'createdAt' | 'updatedAt' | 'userCount'>): Promise<ApiResponse<{ tier: Tier }>> => {
    return apiService.post('/tiers', tierData);
  },

  updateTier: async (tier: string, tierData: Partial<Tier>): Promise<ApiResponse<{ tier: Tier }>> => {
    return apiService.put(`/tiers/${tier}`, tierData);
  },

  deleteTier: async (tier: string): Promise<ApiResponse> => {
    return apiService.delete(`/tiers/${tier}`);
  },

  bulkUpdateUserTiers: async (updates: Array<{ userId: string; tier: string; customDiscount?: number }>): Promise<ApiResponse<any>> => {
    return apiService.put('/tiers/bulk-update', { updates });
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
    // Convert "all" values to empty strings for API compatibility
    const cleanParams = params ? {
      ...params,
      action: params.action === 'all' ? '' : params.action,
    } : undefined;
    return apiService.get('/admin/activity-logs', { params: cleanParams });
  },

  exportActivityLogs: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return apiService.downloadFile(`/admin/activity-logs/export/${format}`, `activity-logs.${format}`);
  },

  // Security Logs
  getSecurityLogs: async (params?: any): Promise<PaginatedResponse<SecurityLog>> => {
    // Convert "all" values to empty strings for API compatibility
    const cleanParams = params ? {
      ...params,
      type: params.type === 'all' ? '' : params.type,
    } : undefined;
    return apiService.get('/admin/security-logs', { params: cleanParams });
  },

  exportSecurityLogs: async (format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    return apiService.downloadFile(`/admin/security-logs/export/${format}`, `security-logs.${format}`);
  },

  // Security Management
  getSecurityOverview: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/admin/security/overview');
  },

  getActiveSessions: async (): Promise<ApiResponse<{sessions: Session[]}>> => {
    return apiService.get('/admin/security/sessions');
  },

  terminateSession: async (sessionId: string): Promise<ApiResponse> => {
    return apiService.delete(`/admin/security/sessions/${sessionId}`);
  },

  blockIpAddress: async (ipAddress: string): Promise<ApiResponse> => {
    return apiService.post('/admin/security/block-ip', { ipAddress });
  },

  getSecuritySettings: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/admin/security/settings');
  },

  updateSecuritySettings: async (settings: any): Promise<ApiResponse<any>> => {
    return apiService.put('/admin/security/settings', settings);
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
