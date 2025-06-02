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
    console.log('Using environment API URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Get the local machine's IP address when running in Expo development
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];
  
  console.log('Debug host info:', { debuggerHost, localhost, platform: Platform.OS });
  
  if (__DEV__) {
    // For physical devices (both iOS and Android), use the development machine's IP
    if (localhost && !Constants.isDevice) {
      const url = `http://${localhost}:8000`;
      console.log('Using physical device URL:', url);
      return url;
    }
    
    // For iOS simulator, use localhost
    if (Platform.OS === 'ios' && !Constants.isDevice) {
      console.log('Using iOS simulator URL: http://localhost:8000');
      return 'http://localhost:8000';
    }
    
    // For Android emulator, use 10.0.2.2 (special Android emulator hostname for localhost)
    if (Platform.OS === 'android' && !Constants.isDevice) {
      console.log('Using Android emulator URL: http://10.0.2.2:8000');
      return 'http://10.0.2.2:8000';
    }

    // For any physical device in development, use the machine's IP
    if (localhost) {
      const url = `http://${localhost}:8000`;
      console.log('Using development machine IP:', url);
      return url;
    }
  }
  
  // Default fallback (should be your production API URL in non-DEV mode)
  console.log('Using default fallback URL: http://localhost:8000');
  return 'http://localhost:8000';
};

// Get the base URL once at startup
const BASE_URL = getBaseUrl();
console.log('Final API Base URL:', BASE_URL);

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
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // Enable cookie authentication
  timeout: 10000, // Add a timeout
});

// Create a public API instance without auth
export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add a timeout
});

// Add request interceptor for JWT token and form data conversion
api.interceptors.request.use(
  async (config) => {
    console.log('Making authenticated request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });

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
    console.log('Making public request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });

    // Only convert to FormData if specifically needed
    if (config.headers?.['Content-Type'] === 'multipart/form-data' && config.method?.toLowerCase() === 'post' && config.data && !(config.data instanceof FormData)) {
      config.data = convertToFormData(config.data);
    }

    return config;
  }
);

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(handleApiError(error, undefined, false));
    
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
        return Promise.reject(handleApiError(refreshError, undefined, false));
      }
    }
    
    return Promise.reject(handleApiError(error, undefined, false));
  }
);

// Add error handling to public API
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Public API request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    // Don't show alerts for auth check failures
    const isAuthCheck = error.config?.url === '/api/checklists/';
    return Promise.reject(handleApiError(error, undefined, !isAuthCheck));
  }
); 