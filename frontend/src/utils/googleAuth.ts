import type { GoogleCredentialResponse } from '../types/google';
import { googleLogin } from '../api/auth';

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = '16732688703-d3b2hm6aqicmo7fcfiuqs422cup98a38.apps.googleusercontent.com';

// Callback function type for successful login
export type LoginCallback = (tokens: { accessToken: string; refreshToken: string }, user: any) => void;
export type ErrorCallback = (error: Error) => void;

let loginCallback: LoginCallback | null = null;
let errorCallback: ErrorCallback | null = null;

// Initialize Google Sign-In
export const initializeGoogleSignIn = (onLogin: LoginCallback, onError: ErrorCallback) => {
  if (typeof window.google === 'undefined') {
    console.error('Google Identity Services script not loaded');
    return;
  }

  loginCallback = onLogin;
  errorCallback = onError;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
};

// Handle the credential response from Google
const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
  try {
    // Send the ID token to our backend
    const loginResponse = await googleLogin(response.credential);
    
    // Call the login callback with tokens and user data
    if (loginCallback) {
      const tokens = {
        accessToken: loginResponse.token, // Backend returns 'token'
        refreshToken: loginResponse.refreshToken,
      };
      
      loginCallback(tokens, loginResponse.user);
    }
  } catch (error) {
    console.error('Error handling Google Sign-In:', error);
    if (errorCallback) {
      errorCallback(error instanceof Error ? error : new Error('Login failed'));
    }
  }
};

// Render Google Sign-In button
export const renderGoogleSignInButton = (element: HTMLElement) => {
  if (typeof window.google === 'undefined') {
    console.error('Google Identity Services script not loaded');
    return;
  }

  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 280
  });
};
