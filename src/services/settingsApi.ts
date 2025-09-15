import apiService from './apiService';
import type { 
  Setting, 
  SettingsCategory, 
  SettingFormData, 
  SettingsResponse, 
  SettingResponse, 
  BulkUpdateRequest, 
  BulkUpdateResponse 
} from '../types/settings';

export const settingsApi = {
  // Get all settings grouped by category
  getAllSettings: async (includePrivate = false): Promise<SettingsCategory> => {
    const params = includePrivate ? { includePrivate: 'true' } : {};
    const response = await apiService.get<SettingsResponse>('/settings', { params });
    return response.data;
  },

  // Get settings by category
  getSettingsByCategory: async (category: string, includePrivate = false): Promise<Setting[]> => {
    const params = includePrivate ? { includePrivate: 'true' } : {};
    const response = await apiService.get<SettingsResponse>(`/settings/category/${category}`, { params });
    return response.data[category] || [];
  },

  // Get single setting by key
  getSettingByKey: async (key: string): Promise<Setting> => {
    const response = await apiService.get<SettingResponse>(`/settings/key/${key}`);
    return response.data;
  },

  // Create new setting
  createSetting: async (data: SettingFormData): Promise<Setting> => {
    const response = await apiService.post<SettingResponse>('/settings', data);
    return response.data;
  },

  // Update setting value
  updateSetting: async (key: string, value: any): Promise<Setting> => {
    const response = await apiService.put<SettingResponse>(`/settings/${key}`, { value });
    return response.data;
  },

  // Bulk update settings
  bulkUpdateSettings: async (settings: BulkUpdateRequest): Promise<BulkUpdateResponse['data']> => {
    const response = await apiService.put<BulkUpdateResponse>('/settings/bulk', settings);
    return response.data;
  },

  // Delete setting
  deleteSetting: async (key: string): Promise<void> => {
    await apiService.delete(`/settings/${key}`);
  },

  // Initialize default settings
  initializeDefaults: async (): Promise<{ initialized: string[]; errors: any[] }> => {
    const response = await apiService.post<{ success: boolean; data: { initialized: string[]; errors: any[] }; message: string }>('/settings/initialize/defaults');
    return response.data;
  },

  // Export settings
  exportSettings: async (format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    const settings = await settingsApi.getAllSettings(true);
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      return blob;
    } else {
      // Convert to CSV format
      const allSettings: Setting[] = Object.values(settings).flat();
      const csvHeader = 'Category,Key,Value,Type,Description,IsPublic,IsEditable\n';
      const csvContent = allSettings.map(setting => 
        `"${setting.category}","${setting.key}","${JSON.stringify(setting.value)}","${setting.type}","${setting.description || ''}","${setting.isPublic}","${setting.isEditable}"`
      ).join('\n');
      
      const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
      return blob;
    }
  },

  // Import settings
  importSettings: async (file: File): Promise<{ imported: number; errors: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let settings: SettingFormData[];

          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            // If it's a grouped format, flatten it
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
              settings = Object.values(parsed).flat() as SettingFormData[];
            } else {
              settings = parsed;
            }
          } else {
            // Parse CSV
            const lines = content.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
            settings = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.replace(/"/g, ''));
              return {
                category: values[0],
                key: values[1],
                value: JSON.parse(values[2]),
                type: values[3] as any,
                description: values[4] || undefined,
                isPublic: values[5] === 'true',
                isEditable: values[6] === 'true'
              };
            });
          }

          // Create settings one by one
          let imported = 0;
          const errors: any[] = [];

          for (const setting of settings) {
            try {
              await settingsApi.createSetting(setting);
              imported++;
            } catch (error: any) {
              errors.push({ key: setting.key, error: error.message });
            }
          }

          resolve({ imported, errors });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
};
