export interface Setting {
  _id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  isPublic: boolean;
  isEditable: boolean;
  validation?: {
    min?: number;
    max?: number;
    enum?: string[];
    required?: boolean;
  };
  metadata?: {
    group?: string;
    order?: number;
    icon?: string;
    helpText?: string;
    unit?: string;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsCategory {
  [category: string]: Setting[];
}

export interface SettingFormData {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  isPublic?: boolean;
  isEditable?: boolean;
  validation?: {
    min?: number;
    max?: number;
    enum?: string[];
    required?: boolean;
  };
  metadata?: {
    group?: string;
    order?: number;
    icon?: string;
    helpText?: string;
    unit?: string;
  };
}

export interface SettingsResponse {
  success: boolean;
  data: SettingsCategory;
  message: string;
}

export interface SettingResponse {
  success: boolean;
  data: Setting;
  message: string;
}

export interface BulkUpdateRequest {
  settings: Array<{
    key: string;
    value: any;
  }>;
}

export interface BulkUpdateResponse {
  success: boolean;
  data: {
    results: Array<{
      key: string;
      success: boolean;
      data?: Setting;
    }>;
    errors: Array<{
      key: string;
      success: boolean;
      error: string;
    }>;
  };
  message: string;
}
