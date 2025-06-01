import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './services/authService';

// Create an axios instance with default config
export const api = axios.create({
  // Replace this with your actual API base URL when you have it
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor for handling tokens
api.interceptors.request.use(
  async (config) => {
    // Get the auth token from storage
    const token = await authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // If the error is not 401 or the request was for refreshing token, reject
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest?.url?.includes('token/refresh')
    ) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    isRefreshing = true;

    try {
      // Try to refresh the token
      const newToken = await authService.refreshToken();
      
      if (newToken && originalRequest) {
        // Update the failed requests queue
        processQueue(null, newToken);
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        processQueue(error, null);
        // If refresh failed, clear auth and reject
        await authService.clearAuth();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      // If refresh failed, clear auth and reject
      await authService.clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
); 