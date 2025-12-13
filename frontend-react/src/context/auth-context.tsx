/**
 * Authentication Context Module
 * 
 * Provides authentication state management across the application.
 * Handles login, logout, registration, session persistence, and automatic token refresh.
 * 
 * Features:
 * - Automatic token refresh before expiration
 * - Secure storage of refresh tokens
 * - Silent re-authentication on page reload
 * 
 * @module auth-context
 * 
 * Usage:
 * ```tsx
 * const { user, login, logout } = useAuth();
 * ```
 */
'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api-client';

/** Token storage keys */
const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

/** Authentication context type definition */
interface AuthContextType {
  /** Current authenticated user or null */
  user: api.User | null;
  /** JWT token for API calls */
  token: string | null;
  /** Loading state during auth initialization */
  isLoading: boolean;
  /** Authenticate user with credentials */
  login: (email: string, password: string) => Promise<void>;
  /** Create new user account */
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  /** Clear session and redirect to login */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Ref to track refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Refresh the access token using the stored refresh token.
   * Implements token rotation (new refresh token is also returned).
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    try {
      const response = await api.refreshToken(refreshToken);

      // Store new tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);

      // Calculate and store expiry time
      const expiryTime = Date.now() + (response.expires_in * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Update API client
      api.setAuthToken(response.access_token);
      setToken(response.access_token);

      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }, []);

  /**
   * Schedule a token refresh before the current token expires.
   * Refreshes 1 minute before expiry to avoid edge cases.
   */
  const scheduleTokenRefresh = useCallback((expiresIn: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh 1 minute before expiry (or at half-life if less than 2 minutes)
    const refreshTime = Math.max(
      (expiresIn * 1000) - 60000,  // 1 minute before expiry
      (expiresIn * 1000) / 2       // or half the remaining time
    );

    console.log(`Scheduling token refresh in ${refreshTime / 1000} seconds`);

    refreshTimerRef.current = setTimeout(async () => {
      const success = await refreshAccessToken();
      if (success) {
        // Get new expiry and schedule next refresh
        const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        if (expiry) {
          const remainingTime = (parseInt(expiry) - Date.now()) / 1000;
          scheduleTokenRefresh(remainingTime);
        }
      } else {
        // Refresh failed, logout user
        console.log('Token refresh failed, logging out');
        clearAuthState();
        router.push('/login');
      }
    }, refreshTime);
  }, [refreshAccessToken, router]);

  /**
   * Clear all auth state and storage.
   */
  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem('chat_history');
    api.setAuthToken(null);

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Initialize authentication on app load.
   * Checks for existing tokens and validates/refreshes as needed.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (storedToken) {
        // Check if token is expired or about to expire
        const isExpired = storedExpiry && Date.now() > parseInt(storedExpiry) - 30000;

        if (isExpired && storedRefreshToken) {
          // Token expired, try to refresh
          console.log('Token expired, attempting refresh...');
          const success = await refreshAccessToken();
          if (!success) {
            clearAuthState();
            setIsLoading(false);
            return;
          }
        } else {
          // Token still valid
          api.setAuthToken(storedToken);
          setToken(storedToken);
        }

        try {
          const currentUser = await api.getMe();
          setUser(currentUser);

          // Schedule next refresh if we have expiry info
          const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
          if (expiry) {
            const remainingTime = (parseInt(expiry) - Date.now()) / 1000;
            if (remainingTime > 0) {
              scheduleTokenRefresh(remainingTime);
            }
          }
        } catch (error) {
          console.error("Session expired or invalid:", error);

          // Try to refresh if we have a refresh token
          if (storedRefreshToken) {
            const success = await refreshAccessToken();
            if (success) {
              try {
                const currentUser = await api.getMe();
                setUser(currentUser);
              } catch {
                clearAuthState();
              }
            } else {
              clearAuthState();
            }
          } else {
            clearAuthState();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshAccessToken, scheduleTokenRefresh, clearAuthState]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);

    // Store both tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);

    // Calculate and store expiry time
    const expiryTime = Date.now() + (response.expires_in * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

    api.setAuthToken(response.access_token);

    const currentUser = await api.getMe();
    setUser(currentUser);
    setToken(response.access_token);

    // Schedule token refresh
    scheduleTokenRefresh(response.expires_in);

    router.push('/');
  };

  const register = async (email: string, password: string, fullName?: string) => {
    await api.register(email, password, fullName);
    // Después de registrar, redirigir a login para que inicie sesión
    router.push('/login');
  };

  const logout = async () => {
    // Notify backend to revoke tokens
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await api.logout(refreshToken || undefined);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    }

    clearAuthState();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
