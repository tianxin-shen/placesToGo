import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogin, refreshToken as refreshTokenApi, getCurrentUser, logout as logoutApi } from '../api/auth';
import { setAccessToken, setRefreshTokenFunction, getCurrentAccessToken } from '../api/client';
import { getAnonymousDataForMigration, clearAnonymousData } from '../utils/userUtils';
import type { UserProfile, LoginResponse } from '../types/api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (tokens: AuthTokens, userData: UserProfile) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  migrateAnonymousData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// Token utilities
const getStoredTokens = (): AuthTokens | null => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
};

const storeTokens = (tokens: AuthTokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  setAccessToken(tokens.accessToken);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setAccessToken(null);
};

const getStoredUser = (): UserProfile | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const storeUser = (user: UserProfile) => {
  console.log('Storing user in localStorage:', user);
  console.log('User name being stored:', user.name);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // Verify storage
  const stored = localStorage.getItem(USER_KEY);
  console.log('Verification - stored user string:', stored);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('Verification - parsed stored user:', parsed);
      console.log('Verification - stored user name:', parsed.name);
    } catch (e) {
      console.error('Error parsing stored user during verification:', e);
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expiryTime;
      
      console.log('Token expiration check:', {
        currentTime: new Date(currentTime).toISOString(),
        expiryTime: new Date(expiryTime).toISOString(),
        isExpired,
        timeUntilExpiry: expiryTime - currentTime
      });
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't decode, assume expired
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        console.log('No stored tokens found for refresh');
        return null;
      }

      console.log('Attempting to refresh token with refresh token:', tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : 'null');
      
      const response = await refreshTokenApi(tokens.refreshToken);
      console.log('Refresh token response:', response);
      
      const newTokens: AuthTokens = {
        accessToken: response.token,
        refreshToken: response.refreshToken || tokens.refreshToken, // Use new refresh token if provided
      };

      storeTokens(newTokens);
      return newTokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens and redirect to login
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      return null;
    }
  }, []);

  // Get valid access token (refresh if needed)
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const tokens = getStoredTokens();
    if (!tokens) return null;

    if (isTokenExpired(tokens.accessToken)) {
      return await refreshAccessToken();
    }

    return tokens.accessToken;
  }, [isTokenExpired, refreshAccessToken]);

  // Migrate anonymous data to user account
  const migrateAnonymousData = useCallback(async (): Promise<void> => {
    try {
      const anonymousData = getAnonymousDataForMigration();
      
      if (!anonymousData.hasData) {
        console.log('No anonymous data to migrate');
        return;
      }

      console.log('Migrating anonymous data:', anonymousData);

      // TODO: Call backend migration endpoint when available
      // For now, we'll just clear the anonymous data
      // In the future, this would be:
      // await apiRequest('/auth/migrate-anonymous-data', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     anonymousUserId: anonymousData.anonymousUserId,
      //     places: anonymousData.places
      //   })
      // });

      // Clear anonymous data after successful migration
      clearAnonymousData();
      console.log('Anonymous data migrated successfully');
      
    } catch (error) {
      console.error('Failed to migrate anonymous data:', error);
      // Don't throw error - migration failure shouldn't break login
    }
  }, []);

  // Set up refresh token function for API client
  useEffect(() => {
    setRefreshTokenFunction(refreshAccessToken);
  }, [refreshAccessToken]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getStoredTokens();
        console.log('Initializing auth - stored tokens:', tokens ? 'exists' : 'null');
        if (!tokens) {
          console.log('No stored tokens found, user needs to login');
          setIsLoading(false);
          return;
        }

        // Check if access token is valid
        if (isTokenExpired(tokens.accessToken)) {
          console.log('Access token expired, attempting refresh...');
          // Try to refresh
          const newToken = await refreshAccessToken();
          if (!newToken) {
            console.log('Token refresh failed, user needs to login again');
            setIsLoading(false);
            return;
          }
          console.log('Token refresh successful');
        } else {
          console.log('Access token is still valid');
        }

        // Get user data - always fetch from backend to ensure we have complete data
        const token = await getAccessToken();
        if (token) {
          try {
            console.log('Initializing auth - fetching user profile from backend...');
            const userData = await getCurrentUser();
            console.log('Initializing auth - user data from backend:', userData);
            setUser(userData);
            storeUser(userData);
            setIsAuthenticated(true);
            console.log('Auth initialized with complete user data:', userData);
          } catch (error) {
            console.error('Failed to fetch user data during initialization:', error);
            
            // Fallback to stored user data from localStorage
            const storedUser = getStoredUser();
            console.log('Falling back to stored user data:', storedUser);
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
              console.log('Auth initialized with stored user data');
            } else {
              console.log('No stored user data, clearing tokens');
              // No stored user data, clear everything
              clearTokens();
            }
          }
        } else {
          console.log('No valid access token available, user needs to login');
          clearTokens();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isTokenExpired, refreshAccessToken, getAccessToken]);

  const login = useCallback(async (tokens: AuthTokens, userData: UserProfile) => {
    console.log('Login function called with tokens:', {
      accessToken: tokens.accessToken ? `${tokens.accessToken.substring(0, 20)}...` : 'null',
      refreshToken: tokens.refreshToken ? `${tokens.refreshToken.substring(0, 20)}...` : 'null'
    });
    console.log('Login function called with userData:', userData);
    
    // Update tokens immediately (synchronous)
    storeTokens(tokens);
    
    // Small delay to ensure tokens are properly set
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Verify the token is set in the client before proceeding
    const currentToken = getCurrentAccessToken();
    console.log('Current token after storage:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null');
    
    if (!currentToken) {
      console.error('Failed to set access token in client state');
      throw new Error('Failed to set access token');
    }
    
    try {
      // Fetch complete user profile from backend
      console.log('Fetching complete user profile...');
      const completeUserData = await getCurrentUser();
      console.log('Complete user data from backend:', completeUserData);
      
      // Store complete user data
      storeUser(completeUserData);
      setUser(completeUserData);
      setIsAuthenticated(true);
      
      console.log('Login successful with complete user data:', completeUserData);
      
      // Handle migration in the background (don't block the login)
      migrateAnonymousData().catch(error => {
        console.error('Migration failed but login succeeded:', error);
      });
    } catch (error) {
      console.error('Failed to fetch complete user profile:', error);
      
      // Fallback to basic user data if /api/auth/me fails
      console.log('Falling back to basic user data from login response');
      storeUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Handle migration in the background
      migrateAnonymousData().catch(migrationError => {
        console.error('Migration failed but login succeeded:', migrationError);
      });
    }
  }, [migrateAnonymousData]);

  const logout = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Call logout endpoint to invalidate session
        await logoutApi();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [getAccessToken]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    getAccessToken,
    migrateAnonymousData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 