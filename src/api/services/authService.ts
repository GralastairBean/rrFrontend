import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config';
import { TokenObtainPairRequest, TokenObtainPairResponse, TokenRefreshRequest, TokenRefreshResponse } from '../types';

const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USER_EMAIL_KEY = '@user_email';

export const authService = {
  // Login with email and password
  login: async (credentials: TokenObtainPairRequest): Promise<TokenObtainPairResponse> => {
    const response = await api.post<TokenObtainPairResponse>('/auth/jwt/create/', credentials);
    
    // Store the auth tokens and email
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, response.data.access],
      [REFRESH_TOKEN_KEY, response.data.refresh],
      [USER_EMAIL_KEY, credentials.email]
    ]);
    
    return response.data;
  },

  // Refresh the access token
  refreshToken: async (): Promise<string | null> => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }

      const response = await api.post<TokenRefreshResponse>('/auth/jwt/refresh/', {
        refresh: refreshToken
      });

      const newAccessToken = response.data.access;
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      return newAccessToken;
    } catch (error) {
      // If refresh fails, clear auth data
      await authService.clearAuth();
      return null;
    }
  },

  // Get the stored access token
  getAccessToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Get the stored refresh token
  getRefreshToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Get the stored user email
  getUserEmail: async (): Promise<string | null> => {
    return AsyncStorage.getItem(USER_EMAIL_KEY);
  },

  // Check if the user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    ]);
    return accessToken !== null && refreshToken !== null;
  },

  // Clear stored authentication data (logout)
  clearAuth: async (): Promise<void> => {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_EMAIL_KEY]);
  },
}; 