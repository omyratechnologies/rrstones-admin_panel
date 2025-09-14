import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
    key?: string; // R2 object key
    provider?: string; // 'cloudflare-r2'
  };
  error?: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data?: {
    successful: Array<{
      filename: string;
      originalName: string;
      size: number;
      mimetype: string;
      url: string;
      key: string;
      provider: string;
    }>;
    failed: Array<{
      error: string;
      originalName: string;
    }>;
  };
  error?: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  message: string;
  data?: {
    uploadUrl: string;
    key: string;
    expiresIn: number;
  };
  error?: string;
}

// Create axios instance with auth token
const createApiInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
};

export const uploadImage = async (file: File, requireAuth: boolean = false): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    let response;
    
    if (requireAuth) {
      // Use authenticated endpoint
      const api = createApiInstance();
      const token = localStorage.getItem('token');
      console.log('Using authenticated upload. Token exists:', !!token);
      
      response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Use public endpoint (no authentication required)
      console.log('Using public upload endpoint');
      response = await axios.post(`${API_BASE_URL}/upload/public/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    return response.data;
  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // More specific error message based on status code
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Permission denied. You need admin access to upload images.');
    } else {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Upload failed'
      );
    }
  }
};

export const uploadMultipleImages = async (files: File[], requireAuth: boolean = false): Promise<MultipleUploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    let response;
    
    if (requireAuth) {
      // Use authenticated endpoint
      const api = createApiInstance();
      response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Use public endpoint (no authentication required)
      response = await axios.post(`${API_BASE_URL}/upload/public/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    return response.data;
  } catch (error: any) {
    console.error('Multiple upload error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Permission denied. You need admin access to upload images.');
    } else {
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Multiple upload failed'
      );
    }
  }
};

export const deleteImage = async (key: string): Promise<UploadResponse> => {
  try {
    const api = createApiInstance();
    // Encode the key to handle special characters and slashes
    const encodedKey = encodeURIComponent(key);
    const response = await api.delete(`/upload/image/${encodedKey}`);
    return response.data;
  } catch (error: any) {
    console.error('Delete error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Delete failed'
    );
  }
};

export const generatePresignedUploadUrl = async (
  filename: string, 
  contentType: string, 
  folder: string = 'granite/images',
  requireAuth: boolean = false
): Promise<PresignedUrlResponse> => {
  try {
    let response;
    
    if (requireAuth) {
      // Use authenticated endpoint
      const api = createApiInstance();
      response = await api.post('/upload/presigned-url', {
        filename,
        contentType,
        folder
      });
    } else {
      // Use public endpoint
      response = await axios.post(`${API_BASE_URL}/upload/public/presigned-url`, {
        filename,
        contentType,
        folder
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Presigned URL generation error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to generate presigned URL'
    );
  }
};

export const uploadToPresignedUrl = async (presignedUrl: string, file: File): Promise<boolean> => {
  try {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
    return true;
  } catch (error: any) {
    console.error('Direct upload error:', error);
    throw new Error('Failed to upload file directly to R2');
  }
};

export const getFileInfo = async (key: string, requireAuth: boolean = false): Promise<any> => {
  try {
    const encodedKey = encodeURIComponent(key);
    let response;
    
    if (requireAuth) {
      // Use authenticated endpoint
      const api = createApiInstance();
      response = await api.get(`/upload/file-info/${encodedKey}`);
    } else {
      // Use public endpoint
      response = await axios.get(`${API_BASE_URL}/upload/public/file-info/${encodedKey}`);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Get file info error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to get file info'
    );
  }
};

// Convenience functions for public uploads (most common use case)
export const uploadPublicImage = async (file: File): Promise<UploadResponse> => {
  return uploadImage(file, false);
};

export const uploadPublicImages = async (files: File[]): Promise<MultipleUploadResponse> => {
  return uploadMultipleImages(files, false);
};

export const generatePublicPresignedUrl = async (
  filename: string, 
  contentType: string, 
  folder: string = 'granite/images'
): Promise<PresignedUrlResponse> => {
  return generatePresignedUploadUrl(filename, contentType, folder, false);
};

export const getPublicFileInfo = async (key: string): Promise<any> => {
  return getFileInfo(key, false);
};
