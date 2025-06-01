import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, publicApi } from '../config';
import type { TokenObtainPairResponse, User } from '../types';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USERNAME_KEY = '@auth_username';

export const authService = {
  async register(username: string): Promise<void> {
    // Register the user and get tokens in the response
    const response = await publicApi.post<User>('/auth/user/', {
      username: username.trim()
    });
    
    if (!response.data?.tokens) {
      throw new Error('No tokens received from registration');
    }

    const { tokens } = response.data;
    if (!tokens.access || !tokens.refresh) {
      throw new Error('Invalid token format received');
    }
    
    // Store tokens and username
    await this.storeAuthData(tokens, username);
  },

  async storeAuthData(tokens: TokenObtainPairResponse, username: string): Promise<void> {
    if (!tokens.access || !tokens.refresh || !username) {
      throw new Error('Missing required data for storage');
    }

    const items: [string, string][] = [
      [TOKEN_KEY, tokens.access],
      [REFRESH_TOKEN_KEY, tokens.refresh],
      [USERNAME_KEY, username]
    ];

    // Validate no null/undefined values
    if (items.some(([_, value]) => value == null)) {
      throw new Error('Cannot store null or undefined values');
    }

    await AsyncStorage.multiSet(items);
  },

  async refreshToken(): Promise<string | null> {
    const refresh = await this.getRefreshToken();
    if (!refresh) return null;

    try {
      const response = await publicApi.post<TokenObtainPairResponse>('/auth/jwt/refresh/', { refresh });
      const { access } = response.data;
      if (!access) {
        throw new Error('No access token received from refresh');
      }
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