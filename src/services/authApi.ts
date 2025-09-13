import apiService from './apiService';
import type { 
  User, 
  CreateUserData, 
  ApiResponse, 
  UserManagementResponse,
  UserFilters,
  LoginCredentials 
} from '@/types';

export const authApi = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiService.post('/auth/login', credentials);
  },

  register: async (userData: CreateUserData): Promise<ApiResponse<{ user: User; token: string }>> => {
    return apiService.post('/auth/register', userData);
  },

  logout: async (): Promise<ApiResponse> => {
    return apiService.post('/auth/logout');
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiService.get('/auth/me');
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    return apiService.put('/auth/profile', userData);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> => {
    return apiService.put('/auth/change-password', data);
  },

  deleteAccount: async (password: string): Promise<ApiResponse> => {
    return apiService.delete('/auth/account', { data: { password } });
  },
};

export const userApi = {
  // Dashboard and Statistics
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    return apiService.get('/users/stats');
  },

  getUserStats: async (period = '30d'): Promise<ApiResponse<any>> => {
    return apiService.get('/users/user-stats', { params: { period } });
  },

  // User CRUD Operations
  getUsers: async (filters: UserFilters = {}): Promise<UserManagementResponse> => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.tier && { tier: filters.tier }),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && { search: filters.search }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      ...(filters.includeCustomers && { includeCustomers: filters.includeCustomers }),
    };
    return apiService.get('/users', { params });
  },

  getUserById: async (id: string): Promise<ApiResponse<{ user: User; statistics?: any }>> => {
    return apiService.get(`/users/${id}`);
  },

  createUser: async (userData: CreateUserData): Promise<ApiResponse<{ user: User }>> => {
    const payload = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      company: userData.company || '',
      address: userData.address || '',
      role: userData.role || 'customer',
      tier: userData.tier || 'T3',
      customDiscount: userData.customDiscount || null,
      password: userData.password
    };
    return apiService.post('/users', payload);
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const payload = {
      ...(userData.name && { name: userData.name }),
      ...(userData.phone !== undefined && { phone: userData.phone }),
      ...(userData.company !== undefined && { company: userData.company }),
      ...(userData.address !== undefined && { address: userData.address }),
      ...(userData.tier && { tier: userData.tier }),
      ...(userData.customDiscount !== undefined && { customDiscount: userData.customDiscount }),
      ...(userData.isActive !== undefined && { isActive: userData.isActive }),
    };
    return apiService.put(`/users/${id}`, payload);
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/users/${id}`);
  },

  // User Management Operations
  updateUserTier: async (id: string, tier: 'T1' | 'T2' | 'T3', customDiscount?: number, reason?: string): Promise<ApiResponse<{ user: User }>> => {
    const payload = {
      tier,
      ...(customDiscount !== undefined && { customDiscount }),
      ...(reason && { reason })
    };
    return apiService.put(`/users/${id}/tier`, payload);
  },

  updateUserStatus: async (id: string, isActive: boolean, reason?: string): Promise<ApiResponse<{ user: User }>> => {
    const payload = {
      isActive,
      ...(reason && { reason })
    };
    return apiService.put(`/users/${id}/status`, payload);
  },

  bulkUserAction: async (userIds: string[], action: 'activate' | 'deactivate' | 'delete'): Promise<ApiResponse<{ affectedCount: number; action: string }>> => {
    return apiService.put('/users/bulk', { userIds, action });
  },

  // Export and Communication
  exportUsers: async (format: 'csv' | 'excel' = 'csv', filters?: UserFilters): Promise<void> => {
    const params = {
      ...(filters?.tier && { tier: filters.tier }),
      ...(filters?.role && { role: filters.role }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.search && { search: filters.search }),
    };
    return apiService.downloadFile('/users/export/csv', `users.${format}`, { params });
  },

  sendMessage: async (userId: string, subject: string, message: string): Promise<ApiResponse<{ messageData: any }>> => {
    return apiService.post(`/users/${userId}/message`, { subject, message });
  },
};
