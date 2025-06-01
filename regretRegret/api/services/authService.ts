import * as SecureStore from 'expo-secure-store';
import { api, publicApi } from '../config';
import type { TokenObtainPairResponse, User } from '../types';

const TOKEN_KEY = 'auth.token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const USERNAME_KEY = 'auth.username';

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

    // Store tokens and username securely
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, tokens.access),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh),
      SecureStore.setItemAsync(USERNAME_KEY, username)
    ]);
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
      await SecureStore.setItemAsync(TOKEN_KEY, access);
      return access;
    } catch (error) {
      // If refresh fails, clear auth and force re-registration
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
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USERNAME_KEY)
    ]);
  }
}; 