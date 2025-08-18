import { apiRequest } from './client';
import type { LoginResponse, GoogleLoginRequest, UserProfile, AuthError } from '../types/api';

// Google OAuth login (public endpoint - no auth required)
export const googleLogin = async (googleIdToken: string): Promise<LoginResponse> => {
  const request: GoogleLoginRequest = { token: googleIdToken };
  const response = await apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return response;
};

// Refresh access token (public endpoint - no auth required)
export const refreshToken = async (refreshToken: string): Promise<{ token: string; refreshToken?: string }> => {
  console.log('refreshToken - making direct fetch call to /auth/refresh');
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Refresh token failed:', response.status, error);
    throw new Error(error.message || 'Failed to refresh token');
  }
  
  const data = await response.json();
  console.log('refreshToken - response:', data);
  return data;
};

// Get current user info (requires auth)
export const getCurrentUser = async (): Promise<UserProfile> => {
  console.log('getCurrentUser - making API call to /auth/me');
  const response = await apiRequest<{ user: UserProfile }>('/auth/me');
  console.log('getCurrentUser - response:', response);
  console.log('getCurrentUser - response.user:', response.user);
  return response.user;
};

// Logout (requires auth)
export const logout = async (): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
  return response;
};

// Migrate anonymous data to user account (requires auth)
export const migrateAnonymousData = async (anonymousUserId: string, places: any[]): Promise<{ message: string; migratedCount: number }> => {
  const response = await apiRequest<{ message: string; migratedCount: number }>('/auth/migrate-anonymous-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      anonymousUserId,
      places
    }),
  });
  return response;
}; 