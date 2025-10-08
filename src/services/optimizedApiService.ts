import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { requestManager } from '@/utils/requestManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Function to get token from auth storage
const getAuthToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsedStorage = JSON.parse(authStorage);
      return parsedStorage.state?.token;
    }
  } catch (error) {
    console.error('Error parsing auth storage:', error);
  }
  return null;
};

class OptimizedApiService {
  private client: AxiosInstance;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Increased timeout to handle queued requests
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and implement request deduplication
    this.client.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.metadata = {
          requestId: this.generateRequestId(config),
          startTime: Date.now()
        };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and track performance
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        if (duration > 5000) {
          console.warn(`Slow API request detected: ${response.config.url} took ${duration}ms`);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth storage
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        
        // Log request details for debugging
        const config = error.config;
        if (config) {
          const duration = Date.now() - (config.metadata?.startTime || 0);
          console.error(`API Error: ${config.method?.toUpperCase()} ${config.url}`, {
            status: error.response?.status,
            duration,
            data: error.response?.data
          });
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generate a unique request ID for deduplication
  private generateRequestId(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const params = JSON.stringify(config.params || {});
    const data = typeof config.data === 'object' ? JSON.stringify(config.data) : config.data || '';
    return `${method}:${url}:${params}:${data}`;
  }

  // Enhanced GET method with request deduplication and priority
  async get<T>(url: string, config?: AxiosRequestConfig & { priority?: number }): Promise<T> {
    const requestKey = this.generateRequestId({ method: 'GET', url, ...config });
    
    // Check if identical request is already in progress
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const priority = config?.priority || 5;
    const { priority: _, ...axiosConfig } = config || {};

    const requestPromise = requestManager.queueRequest(
      requestKey,
      async () => {
        const response = await this.client.get<T>(url, axiosConfig);
        return response.data;
      },
      priority
    );

    // Cache the promise to prevent duplicate requests
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      this.pendingRequests.delete(requestKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  // Enhanced POST method with deduplication for idempotent operations
  async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig & { priority?: number; allowDuplicates?: boolean }
  ): Promise<T> {
    const priority = config?.priority || 7; // Higher priority for POST requests
    const allowDuplicates = config?.allowDuplicates ?? true;
    const { priority: _, allowDuplicates: __, ...axiosConfig } = config || {};

    if (!allowDuplicates) {
      const requestKey = this.generateRequestId({ method: 'POST', url, data, ...axiosConfig });
      
      if (this.pendingRequests.has(requestKey)) {
        return this.pendingRequests.get(requestKey);
      }

      const requestPromise = requestManager.queueRequest(
        requestKey,
        async () => {
          const response = await this.client.post<T>(url, data, axiosConfig);
          return response.data;
        },
        priority
      );

      this.pendingRequests.set(requestKey, requestPromise);

      try {
        const result = await requestPromise;
        this.pendingRequests.delete(requestKey);
        return result;
      } catch (error) {
        this.pendingRequests.delete(requestKey);
        throw error;
      }
    } else {
      // Allow duplicates - execute immediately with lower priority
      return requestManager.queueRequest(
        `post-${Date.now()}-${Math.random()}`,
        async () => {
          const response = await this.client.post<T>(url, data, axiosConfig);
          return response.data;
        },
        priority
      );
    }
  }

  // Enhanced PUT method
  async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig & { priority?: number }
  ): Promise<T> {
    const priority = config?.priority || 8; // High priority for updates
    const { priority: _, ...axiosConfig } = config || {};

    return requestManager.queueRequest(
      `put-${url}-${Date.now()}`,
      async () => {
        const response = await this.client.put<T>(url, data, axiosConfig);
        return response.data;
      },
      priority
    );
  }

  // Enhanced PATCH method
  async patch<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig & { priority?: number }
  ): Promise<T> {
    const priority = config?.priority || 8; // High priority for patches
    const { priority: _, ...axiosConfig } = config || {};

    return requestManager.queueRequest(
      `patch-${url}-${Date.now()}`,
      async () => {
        const response = await this.client.patch<T>(url, data, axiosConfig);
        return response.data;
      },
      priority
    );
  }

  // Enhanced DELETE method
  async delete<T>(
    url: string, 
    config?: AxiosRequestConfig & { priority?: number }
  ): Promise<T> {
    const priority = config?.priority || 9; // Highest priority for deletions
    const { priority: _, ...axiosConfig } = config || {};

    return requestManager.queueRequest(
      `delete-${url}-${Date.now()}`,
      async () => {
        const response = await this.client.delete<T>(url, axiosConfig);
        return response.data;
      },
      priority
    );
  }

  // File upload with progress tracking
  async uploadFile<T>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void,
    config?: { priority?: number }
  ): Promise<T> {
    const priority = config?.priority || 6;
    
    return requestManager.queueRequest(
      `upload-${file.name}-${file.size}-${Date.now()}`,
      async () => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.client.post<T>(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        });

        return response.data;
      },
      priority
    );
  }

  // Download file with queue management
  async downloadFile(
    url: string, 
    filename?: string, 
    config?: AxiosRequestConfig & { priority?: number }
  ): Promise<void> {
    const priority = config?.priority || 4; // Lower priority for downloads
    const { priority: _, ...axiosConfig } = config || {};

    return requestManager.queueRequest(
      `download-${url}-${Date.now()}`,
      async () => {
        const response = await this.client.get(url, {
          responseType: 'blob',
          ...axiosConfig,
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      },
      priority
    );
  }

  // Batch requests with automatic prioritization
  async batchGet<T>(requests: Array<{ url: string; config?: AxiosRequestConfig }>): Promise<T[]> {
    const batchRequests = requests.map((req, index) => ({
      key: `batch-get-${index}-${req.url}`,
      fn: () => this.client.get<T>(req.url, req.config).then(response => response.data),
      priority: 6
    }));

    return requestManager.batchRequests(batchRequests, 4);
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get current token
  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get request manager status for debugging
  getRequestStatus() {
    return requestManager.getQueueStatus();
  }

  // Clear all pending requests (useful for logout)
  clearPendingRequests() {
    this.pendingRequests.clear();
    requestManager.clearCache();
  }
}

// Extend the AxiosRequestConfig interface to include our custom metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
  }
}

export default new OptimizedApiService();