import apiService from '../apiService';

export const permissionApi = {
  // Permission endpoints
  getAllPermissions: async () => {
    const response = await apiService.get('/permissions');
    return response;
  },

  createPermission: async (data: {
    name: string;
    code: string;
    description: string;
    module: string;
  }) => {
    const response = await apiService.post('/permissions', data);
    return response;
  },

  updatePermission: async (id: string, data: Partial<{
    name: string;
    code: string;
    description: string;
    module: string;
  }>) => {
    const response = await apiService.put(`/permissions/${id}`, data);
    return response;
  },

  deletePermission: async (id: string) => {
    const response = await apiService.delete(`/permissions/${id}`);
    return response;
  },

  // Role endpoints
  getAllRoles: async () => {
    const response = await apiService.get('/permissions/roles');
    return response;
  },

  createRole: async (data: {
    name: string;
    code: string;
    description: string;
    permissions: string[];
    hierarchy?: number;
  }) => {
    const response = await apiService.post('/permissions/roles', data);
    return response;
  },

  updateRole: async (id: string, data: Partial<{
    name: string;
    code: string;
    description: string;
    permissions: string[];
    hierarchy: number;
  }>) => {
    const response = await apiService.put(`/permissions/roles/${id}`, data);
    return response;
  },

  deleteRole: async (id: string) => {
    const response = await apiService.delete(`/permissions/roles/${id}`);
    return response;
  },

  // User permission endpoints
  getUserPermissions: async (userId: string) => {
    const response = await apiService.get(`/permissions/users/${userId}/permissions`);
    return response;
  },

  assignUserPermissions: async (userId: string, data: {
    permissions: string[];
    role?: string;
  }) => {
    const response = await apiService.put(`/permissions/users/${userId}/permissions`, data);
    return response;
  },

  revokeUserPermissions: async (userId: string, data: {
    permissions: string[];
  }) => {
    const response = await apiService.post(`/permissions/users/${userId}/revoke`, data);
    return response;
  },

  // Analytics endpoints
  getPermissionAnalytics: async () => {
    const response = await apiService.get('/permissions/analytics');
    return response;
  },

  // Check permissions
  checkUserPermission: async (userId: string, permission: string) => {
    const response = await apiService.get(`/permissions/users/${userId}/check/${permission}`);
    return response;
  },
};
