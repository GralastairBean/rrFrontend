import * as SecureStore from 'expo-secure-store';
import { api, publicApi } from '../config';
import type { TokenObtainPairResponse, User } from '../types';
import type { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth.token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const USERNAME_KEY = 'auth.username';
// Refresh token 1 minute before expiry
const REFRESH_THRESHOLD = 60 * 1000;
let refreshTimeout: NodeJS.Timeout | null = null;

export const authService = {
  async register(username: string): Promise<void> {
    try {
      console.log('Starting registration for username:', username);
      console.log('API base URL:', publicApi.defaults.baseURL);
      
      // Register the user and get tokens in the response
      const response = await publicApi.post<User>('/auth/user/', {
        username: username.trim()
      });
      
      console.log('Registration response:', response.status, response.data);
      
      if (!response.data?.tokens) {
        throw new Error('No tokens received from registration');
      }

      const { tokens } = response.data;
      if (!tokens.access || !tokens.refresh) {
        throw new Error('Invalid token format received');
      }
      
      console.log('Storing auth data...');
      // Store tokens and username
      await this.storeAuthData(tokens, username);

      // Set the token in the API client headers
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      console.log('Registration complete and tokens stored');
    } catch (error: unknown) {
      console.error('Registration failed:', error);
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
      throw error;
    }
  },

  scheduleTokenRefresh(token: string) {
    try {
      // Clear any existing refresh timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }

      // Decode the JWT to get expiration time
      const decoded = jwtDecode<{ exp: number }>(token);
      if (!decoded.exp) {
        console.warn('No expiration found in token');
        return;
      }

      // Calculate when the token expires
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Calculate when we should refresh (threshold before expiry)
      const refreshAt = expiresAt - REFRESH_THRESHOLD;
      const timeUntilRefresh = refreshAt - now;

      console.log('Token refresh scheduled:', {
        expiresAt: new Date(expiresAt).toISOString(),
        refreshAt: new Date(refreshAt).toISOString(),
        timeUntilRefresh: Math.round(timeUntilRefresh / 1000) + ' seconds'
      });

      // Only schedule refresh if token isn't already expired
      if (timeUntilRefresh > 0) {
        refreshTimeout = setTimeout(async () => {
          console.log('Proactively refreshing token...');
          await this.refreshToken();
        }, timeUntilRefresh);
      } else {
        console.warn('Token is already expired or too close to expiry');
        this.refreshToken(); // Refresh immediately if token is expired
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  },

  async storeAuthData(tokens: TokenObtainPairResponse, username: string): Promise<void> {
    if (!tokens.access || !tokens.refresh || !username) {
      throw new Error('Missing required data for storage');
    }

    // Store tokens and username securely
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, tokens.access),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh),
      SecureStore.setItemAsync(USERNAME_KEY, username)
    ]);

    // Schedule refresh for the new token
    this.scheduleTokenRefresh(tokens.access);
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refresh = await this.getRefreshToken();
      if (!refresh) {
        console.log('No refresh token available');
        await this.clearAuth();
        return null;
      }

      console.log('Attempting to refresh access token');
      const response = await publicApi.post<TokenObtainPairResponse>('/auth/jwt/refresh/', { refresh });
      
      if (!response.data.access) {
        console.error('No access token received from refresh');
        await this.clearAuth();
        return null;
      }

      // Store the new access token
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.access);
      
      // Update the API client headers with the new token
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      // Schedule the next refresh
      this.scheduleTokenRefresh(response.data.access);
      
      console.log('Successfully refreshed access token');
      return response.data.access;
    } catch (error: unknown) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear all auth data to ensure clean state
      await this.clearAuth();
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async getStoredUsername(): Promise<string | null> {
    return SecureStore.getItemAsync(USERNAME_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('Checking authentication status...');
      const [token, refresh] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken()
      ]);

      console.log('Stored tokens:', { hasAccessToken: !!token, hasRefreshToken: !!refresh });

      // If we have no tokens at all, we're not authenticated
      if (!token && !refresh) return false;

      // Set the token in the API client headers if we have one
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // If we have a refresh token but no access token, try to refresh
      if (!token && refresh) {
        const newToken = await this.refreshToken();
        return !!newToken;
      }

      // If we have both tokens, verify the access token by making a test request
      if (token) {
        try {
          console.log('Making test request to verify token...');
          // Make a test request to verify the token
          await api.get('/api/checklists/');
          console.log('Token verification successful');
          return true;
        } catch (error: unknown) {
          console.error('Token verification failed:', error);
          // If the token is invalid, try refreshing
          const newToken = await this.refreshToken();
          return !!newToken;
        }
      }

      return false;
    } catch (error: unknown) {
      console.error('Auth check failed:', error);
      return false;
    }
  },

  async clearAuth(): Promise<void> {
    console.log('Clearing authentication data...');
    try {
      // Clear any scheduled refresh
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }

      // Clear the stored tokens
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USERNAME_KEY)
      ]);

      // Clear the API client headers
      delete api.defaults.headers.common['Authorization'];
      console.log('Authentication data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Even if there's an error, still remove the Authorization header
      delete api.defaults.headers.common['Authorization'];
    }
  },

  async logout(): Promise<void> {
    await this.clearAuth();
  }
}; 