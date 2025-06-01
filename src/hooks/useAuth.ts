import { useState, useCallback, useEffect } from 'react';
import { authService } from '../api/services/authService';
import { TokenObtainPairRequest } from '../api/types';

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check initial auth state
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const email = await authService.getUserEmail();
      setUserEmail(email);
    } catch (err) {
      setError('Failed to check auth state');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const credentials: TokenObtainPairRequest = {
        email,
        password
      };

      await authService.login(credentials);
      setUserEmail(email);
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
      setUserEmail(null);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    userEmail,
    isAuthenticated: !!userEmail,
    isLoading,
    error,
    login,
    logout
  };
}; 