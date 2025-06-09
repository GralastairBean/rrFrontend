import * as SecureStore from 'expo-secure-store';
import { api, publicApi } from '../config';
import type { TokenObtainPairResponse, User } from '../types';
import type { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth.token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const USERNAME_KEY = 'auth.username';

export const authService = {
  async register(username: string): Promise<void> {
    try {
      console.log('🔐 Starting registration for username:', username);
      console.log('🌐 API base URL:', publicApi.defaults.baseURL);
      
      const response = await publicApi.post<User>('/auth/user/', {
        username: username.trim()
      });
      
      console.log('✅ Registration successful. Status:', response.status);
      console.log('🔑 Tokens received:', response.data?.tokens ? 'Yes' : 'No');
      
      if (!response.data?.tokens) {
        throw new Error('No tokens received from registration');
      }

      const { tokens } = response.data;
      if (!tokens.access || !tokens.refresh) {
        throw new Error('Invalid token format received');
      }
      
      console.log('💾 Storing auth data...');
      await this.storeAuthData(tokens, username);

      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      console.log('🎉 Registration complete and tokens stored successfully');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  async storeAuthData(tokens: TokenObtainPairResponse, username: string): Promise<void> {
    console.log('💾 Starting token storage...');
    if (!tokens.access || !tokens.refresh || !username) {
      console.error('❌ Missing required data for storage:', {
        hasAccess: !!tokens.access,
        hasRefresh: !!tokens.refresh,
        hasUsername: !!username
      });
      throw new Error('Missing required data for storage');
    }

    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, tokens.access),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh),
        SecureStore.setItemAsync(USERNAME_KEY, username)
      ]);
      console.log('✅ Tokens and username stored successfully');
    } catch (error) {
      console.error('❌ Failed to store auth data:', error);
      throw error;
    }
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refresh = await this.getRefreshToken();
      if (!refresh) {
        console.log('❌ No refresh token available');
        await this.clearAuth();
        return null;
      }

      console.log('🌐 Sending refresh token request...');
      const response = await publicApi.post<TokenObtainPairResponse>('/auth/jwt/refresh/', { refresh });
      
      if (!response.data.access) {
        console.error('❌ No access token received from refresh');
        await this.clearAuth();
        return null;
      }

      // Store both new tokens if refresh token is provided
      if (response.data.refresh) {
        console.log('✅ Received new access and refresh tokens');
        await Promise.all([
          SecureStore.setItemAsync(TOKEN_KEY, response.data.access),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refresh)
        ]);
        console.log('💾 Both tokens stored successfully');
      } else {
        console.log('✅ Received new access token only');
        await SecureStore.setItemAsync(TOKEN_KEY, response.data.access);
        console.log('💾 New access token stored');
      }

      const decoded = jwtDecode<{ exp: number }>(response.data.access);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      console.log('⏰ New access token expires:', {
        expiresAt: new Date(expiresAt).toISOString(),
        timeUntilExpiry: Math.round((expiresAt - now) / 1000) + ' seconds'
      });
      
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      console.log('🔑 API headers updated with new token');
      
      console.log('🎉 Token refresh completed successfully');
      return response.data.access;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      
      // Check if token is blacklisted
      if (error?.response?.data?.detail === 'Token is blacklisted') {
        console.log('🚫 Refresh token is blacklisted, need to register again');
        await this.clearAuth();
        return null;
      }
      
      // For other errors, clear auth and return null
      await this.clearAuth();
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      console.log('🔍 Checking authentication status...');
      const [token, refresh] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken()
      ]);

      console.log('🔑 Auth status:', { 
        hasAccessToken: !!token, 
        hasRefreshToken: !!refresh,
        accessTokenHeader: !!api.defaults.headers.common['Authorization']
      });

      if (!token && !refresh) {
        console.log('❌ No tokens available');
        return false;
      }

      // Make a test request to verify the token
      try {
        console.log('🌐 Making test request to verify token...');
        await api.get('/api/checklists/');
        console.log('✅ Token verification successful');
        return true;
      } catch (error) {
        console.error('❌ Token verification failed:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      return false;
    }
  },

  async clearAuth(): Promise<void> {
    console.log('🧹 Clearing authentication data...');
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USERNAME_KEY)
      ]);
      console.log('✅ Tokens deleted from storage');

      delete api.defaults.headers.common['Authorization'];
      console.log('✅ API headers cleared');
      
      console.log('🎉 Authentication data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
      delete api.defaults.headers.common['Authorization'];
    }
  },

  async getStoredUsername(): Promise<string | null> {
    try {
      const username = await SecureStore.getItemAsync(USERNAME_KEY);
      console.log('👤 Retrieved username:', username ? 'exists' : 'null');
      return username;
    } catch (error) {
      console.error('❌ Error retrieving username:', error);
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      console.log('🔑 Retrieved access token:', token ? 'exists' : 'null');
      if (token) {
        const decoded = jwtDecode<{ exp: number }>(token);
        const expiresAt = decoded.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        console.log('⏰ Access token status:', {
          expiresAt: new Date(expiresAt).toISOString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + ' seconds',
          isExpired: timeUntilExpiry <= 0
        });
      }
      return token;
    } catch (error) {
      console.error('❌ Error retrieving access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      console.log('🔄 Retrieved refresh token:', token ? 'exists' : 'null');
      return token;
    } catch (error) {
      console.error('❌ Error retrieving refresh token:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    await this.clearAuth();
  }
}; 