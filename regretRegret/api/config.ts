import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { authService } from './services/authService';
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

// Create an axios instance with default config
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookie authentication
});

// Add request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    return authService.getAccessToken().then(token => {
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) return Promise.reject(error);
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      return authService.refreshToken().then(newToken => {
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        return Promise.reject(error);
      }).catch(async (refreshError) => {
        // If refresh fails, clear auth and let the error propagate
        await authService.clearAuth();
        return Promise.reject(error);
      });
    }
    
    return Promise.reject(error);
  }
); 