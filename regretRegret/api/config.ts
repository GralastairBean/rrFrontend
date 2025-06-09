import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { authService } from './services/authService';

// Define error response types
interface TokenErrorResponse {
  code: string;
  detail: string;
}

const BASE_URL = 'http://192.168.0.13:8000';

// Function to convert object to FormData
function convertToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
}

// Create API instance with auth
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Create a public API instance without auth
export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor for JWT token and form data conversion
api.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = await authService.getAccessToken();

    if (!token) {
      console.warn('⚠️ No access token available for request');
    }

    // Ensure headers object exists and set token
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert POST data to FormData
    if (config.method?.toLowerCase() === 'post' && config.data && !(config.data instanceof FormData)) {
      config.data = convertToFormData(config.data);
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Function to handle API errors
const handleApiError = (error: unknown, customMessage?: string, showAlert = true) => {
  if (error instanceof Error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error('Error response:', {
        status: axiosError.response.status,
        data: axiosError.response.data,
        headers: axiosError.response.headers
      });
    } else if (axiosError.request) {
      console.error('No response received:', axiosError.request);
    }
  }
  return error;
};

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(handleApiError(error, undefined, false));

    // Check if the error is due to an invalid/expired token
    const isAccessTokenError = error.response?.status === 401;
    const isBlacklistedToken = error.response?.data?.detail === 'Token is blacklisted';

    // If token is blacklisted, clear auth and don't retry
    if (isBlacklistedToken) {
      console.log('🚫 Token is blacklisted, clearing auth...');
      await authService.clearAuth();
      return Promise.reject(error);
    }

    // Only retry once for expired (but not blacklisted) tokens
    if (isAccessTokenError && !isBlacklistedToken && !originalRequest._retry) {
      console.log('🔄 Access token expired, attempting to get new one...');
      originalRequest._retry = true;

      try {
        // Try to get a new access token using refresh token
        const newToken = await authService.refreshToken();
        if (newToken) {
          console.log('✅ Got new access token, retrying original request');
          // Update the request headers with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          // Ensure the base request also has the new token
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Could not get new access token:', refreshError);
        await authService.clearAuth();
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