import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config';
import { TokenObtainPairRequest, TokenObtainPairResponse, TokenRefreshRequest, TokenRefreshResponse, User, UserRegistrationRequest } from '../types';

const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USERNAME_KEY = '@username';

export const authService = {
  // Register a new user and obtain tokens
  register: async (username: string): Promise<TokenObtainPairResponse> => {
    // Generate a random password for the user
    const password = Math.random().toString(36).slice(-8);
    
    const registrationData: UserRegistrationRequest = {
      username,
      password
    };

    // First, create the user
    await api.post<User>('/auth/user/', registrationData);

    // Then, obtain tokens
    const credentials: TokenObtainPairRequest = {
      username,
      password
    };

    const response = await api.post<TokenObtainPairResponse>('/auth/jwt/create/', credentials);
    
    // Store the auth tokens and username
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, response.data.access],
      [REFRESH_TOKEN_KEY, response.data.refresh],
      [USERNAME_KEY, username]
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

  // Get the stored username
  getStoredUsername: async (): Promise<string | null> => {
    return AsyncStorage.getItem(USERNAME_KEY);
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
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USERNAME_KEY]);
  },
}; 