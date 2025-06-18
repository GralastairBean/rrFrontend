import { useState, useCallback, useEffect } from 'react';
import { authService } from '../api/services/authService';
import { TokenObtainPairRequest } from '../api/types';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check initial auth state
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const storedUsername = await authService.getStoredUsername();
      setUsername(storedUsername);
    } catch (err) {
      setError('Failed to check auth state');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with username and password
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const credentials: TokenObtainPairRequest = {
        username,
        password
      };

      await authService.login(username);
      setUsername(username);
      return true;
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.clearAuth();
      setUsername(null);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    username,
    isAuthenticated: !!username,
    isLoading,
    error,
    login,
    logout
  };
}; 