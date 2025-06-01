import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config';
import type { TokenObtainPairRequest, TokenObtainPairResponse, UserRegistrationRequest, User } from '../types';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USERNAME_KEY = '@auth_username';

export const authService = {
  async register(data: UserRegistrationRequest): Promise<void> {
    // First register the user
    await api.post<User>('/auth/user/', data);
    
    // Then immediately get tokens
    const response = await api.post<TokenObtainPairResponse>('/auth/jwt/create/', {
      username: data.username,
      password: data.password
    });
    
    // Store tokens and username
    await this.storeAuthData(response.data, data.username);
  },

  async storeAuthData(tokens: TokenObtainPairResponse, username: string): Promise<void> {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokens.access],
      [REFRESH_TOKEN_KEY, tokens.refresh],
      [USERNAME_KEY, username]
    ]);
  },

  async refreshToken(): Promise<string | null> {
    const refresh = await this.getRefreshToken();
    if (!refresh) return null;

    try {
      const response = await api.post<TokenObtainPairResponse>('/auth/jwt/refresh/', { refresh });
      const { access } = response.data;
      await AsyncStorage.setItem(TOKEN_KEY, access);
      return access;
    } catch (error) {
      // If refresh fails, clear auth and force re-registration
      await this.clearAuth();
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async getStoredUsername(): Promise<string | null> {
    return AsyncStorage.getItem(USERNAME_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    // If we have a token, try to refresh it to ensure it's valid
    try {
      const newToken = await this.refreshToken();
      return !!newToken;
    } catch {
      return false;
    }
  },

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USERNAME_KEY]);
  }
}; 