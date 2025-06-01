import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { authService } from './services/authService';
import { handleApiError } from './utils/errorHandling';
import Constants from 'expo-constants';

// Get the appropriate base URL for the platform
const getBaseUrl = () => {
  // If an explicit API URL is set in environment, use that
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Get the local machine's IP address when running in Expo development
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];
  
  if (__DEV__) {
    // For iOS devices, use the development machine's IP
    if (Platform.OS === 'ios' && localhost) {
      return `http://${localhost}:8000`;
    }
    
    // For iOS simulator, use localhost
    if (Platform.OS === 'ios') {
      return 'http://localhost:8000';
    }
    
    // For Android emulator, use 10.0.2.2 (special Android emulator hostname for localhost)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
  }
  
  // Default fallback (should be your production API URL in non-DEV mode)
  return 'http://localhost:8000';
};

// Helper function to convert data to FormData
const convertToFormData = (data: any): FormData => {
  const formData = new FormData();
  
  // Handle nested objects and arrays
  const appendFormData = (data: any, parentKey?: string) => {
    if (data && typeof data === 'object' && !(data instanceof File) && !(data instanceof Blob)) {
      Object.entries(data).forEach(([key, value]) => {
        const formKey = parentKey ? `${parentKey}[${key}]` : key;
        
        if (value === null || value === undefined) {
          return;
        }
        
        if (value instanceof File || value instanceof Blob) {
          formData.append(formKey, value);
        } else if (typeof value === 'object') {
          appendFormData(value, formKey);
        } else {
          formData.append(formKey, String(value));
        }
      });
    } else if (data !== null && data !== undefined) {
      formData.append(parentKey || 'data', data);
    }
  };
  
  appendFormData(data);
  return formData;
};

// Create an axios instance with default config
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // Enable cookie authentication
});

// Create a public API instance without auth
export const publicApi = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

// Add request interceptor for JWT token and form data conversion
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = await authService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert POST data to FormData
    if (config.method?.toLowerCase() === 'post' && config.data && !(config.data instanceof FormData)) {
      config.data = convertToFormData(config.data);
      if (config.headers) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
    }

    return config;
  }
);

// Add request interceptor for form data conversion to public API
publicApi.interceptors.request.use(
  (config) => {
    // Convert POST data to FormData
    if (config.method?.toLowerCase() === 'post' && config.data && !(config.data instanceof FormData)) {
      config.data = convertToFormData(config.data);
      if (config.headers) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
    }

    return config;
  }
);

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(handleApiError(error));
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await authService.refreshToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear auth and handle the error
        await authService.clearAuth();
        return Promise.reject(handleApiError(refreshError));
      }
    }
    
    return Promise.reject(handleApiError(error));
  }
);

// Add error handling to public API
publicApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(handleApiError(error))
); 