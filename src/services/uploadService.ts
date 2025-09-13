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

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const api = createApiInstance();
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Upload failed'
    );
  }
};

export const deleteImage = async (filename: string): Promise<UploadResponse> => {
  try {
    const api = createApiInstance();
    const response = await api.delete(`/upload/image/${filename}`);
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
